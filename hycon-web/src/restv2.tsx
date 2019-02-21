
import Long = require("long")
// tslint:disable:no-console
export interface IResponseError {
    status: number,
    timestamp: number,
    error: string
    message: string
}

export interface ITx {
    txHash: string
    from?: string
    to?: string
    amount: string
    fee: string
    nonce?: number
    confirmations?: number
    blockhash?: string
    blockTimeStamp: number
}
export interface IBlock {
    height: number

    previousHash: string

    blockhash: string

    txCount: number

    difficulty: string

    merkleRoot: string

    stateRoot: string

    nonce: string

    blockTimeStamp: number

    miner: string

    isMain?: boolean

    totalWork: number

    totalFee: string

    totalSent: string
    txs?: ITx[]
    uncles?: IUncleInfo[]
}
export interface IAccount {
    address: string
    balance: string
    nonce: number
    txs?: ITx[]
    pendings?: ITx[]
    minedBlocks?: IMinedInfo[]
    minedUncles?: IUncleInfo[],
    pendingAmount?: string
}

export interface IMinedInfo {
    blockTimeStamp: number
    height: number
    blockhash: string
    miner: string
    feeReward: string
}

export interface IUncleInfo {
    height: number
    depth: number
    uncleHash: string
    miner: string
    difficulty: string
    uncleTimeStamp: number
}

export const NOT_FOUND_ERROR: IResponseError = {
    error: "Not Found",
    message: "Requested resource was not found",
    status: 404,
    timestamp: Date.now(),
}

export const TIMEOUT_ERROR: IResponseError = {
    error: "Service Unavailable",
    message: "Temploraly Unavailable, Please Retry Later ",
    status: 503,
    timestamp: Date.now(),
}
export const exodusHeight = 404540
export const lastNakamotoBlock = 317713
export const lastGhostBlock = 444444
const uncleRewardR = 75 / 100
const uncleRewardA = 0.9 / uncleRewardR
export function uncleReward(minerReward: number, heightDelta: number) {
    const factor = uncleRewardA * Math.pow(uncleRewardR, heightDelta)
    return Long.fromNumber(factor * minerReward, true)
}
export function getReward(height: number) {
    if (height <= lastNakamotoBlock) {
        return 240e9
    } else if (height <= lastGhostBlock) {
        return 120e9
    }
    return 12e9
}

export class Rest {
    public loading: boolean
    public isHyconWallet: boolean
    public callback: (loading: boolean) => void
    private readonly url = "https://api.hycon.io/api"
    private readonly apiVersion = "v2"
    private apiUrl = `${this.url}/${this.apiVersion}`

    public loadingListener(callback: (loading: boolean) => void): void {
        this.callback = callback
    }
    public setLoading(loading: boolean): void {
        this.loading = loading
        this.callback(this.loading)
    }

    public async getAccountInfo(address: string): Promise<IAccount> {
        try {
            const response = await fetch(`${this.apiUrl}/address/${address}`)
            const account = await response.json()
            const minedBlocks: IMinedInfo[] | IResponseError = await this.getMinedBlocks(address)
            if (minedBlocks === undefined) {
                throw new Error("minedBlocks not found error")
            }

            const minedUncles: IUncleInfo[] | IResponseError = await this.getMinedUncles(address)
            if (minedUncles === undefined) {
                throw new Error("minedBlocks not found error")
            }

            return {
                address: account.address,
                balance: account.balance,
                minedBlocks,
                minedUncles,
                nonce: account.nonce,
                txs: account.txs,
            }

        } catch (e) {
            console.log(`${e}`)
        }
    }

    public async getMinedBlocks(address: string, height?: number, index?: number): Promise<IMinedInfo[]> {
        try {
            height = height === undefined ? (await this.getTopTipHeight()).height : height
            index = index === undefined ? 0 : index

            const response = await fetch(`${this.apiUrl}/minedBlocks/${address}/${height}/${index}`)
            const blocks: IMinedInfo[] = await response.json()

            if (blocks === undefined) {
                throw Error("Not Found Error")
            }

            return blocks
        } catch (e) {
            console.log(`${e}`)
        }
    }

    public async getMinedUncles(address: string, height?: number, index?: number): Promise<IUncleInfo[]> {
        try {
            height = height === undefined ? (await this.getTopTipHeight()).height : height
            index = index === undefined ? 0 : index

            const response = await fetch(`${this.apiUrl}/minedUncles/${address}/${height}/${index}`)
            const uncles: IUncleInfo[] = await response.json()

            if (uncles === undefined) {
                throw Error("Not Found Error")
            }

            return uncles
        } catch (e) {
            console.log(`${e}`)
        }
    }

    public async getTx(hash: string): Promise<ITx> {
        try {
            const tx: ITx = await fetch(`${this.apiUrl}/tx/${hash}`)
                .then((response) => response.json())
                .catch((err) => { throw err })
            if (tx === undefined) {
                throw Error("Not Found Error")
            }
            return tx
        } catch (e) {
            console.log(`${e}`)
        }
    }
    public async getNextTxs(address: string, index: number): Promise<ITx[]> {
        try {
            const txs: ITx[] = await fetch(`${this.apiUrl}/nextTxs/${address}/${index}`)
                .then((response) => response.json())
                .catch((err) => { throw err })

            if (txs === undefined) {
                throw Error("Not Found Error")
            }
            return txs
        } catch (e) {
            console.log(`${e}`)
        }
    }
    public async getBlockByHeight(height: number): Promise<IBlock | IResponseError> {
        if (height === undefined || !Number.isInteger(height)) {
            const res = await this.getTopTipHeight()
            height = res.height
        }

        try {
            const response = await fetch(`${this.apiUrl}/block/height/${height}`)
            return response.json()
        } catch (e) {
            console.log(`${e}`)
        }
    }
    public async getBlock(hash: string): Promise<IBlock> {
        try {
            const response = await fetch(`${this.apiUrl}/block/${hash}`)
            return response.json()
        } catch (e) {
            console.log(`${e}`)
        }
    }

    public async getUncle(hash: string): Promise<IUncleInfo> {
        try {
            const response = await fetch(`${this.apiUrl}/uncle/${hash}`)
            return response.json()
        } catch (e) {
            console.log(`${e}`)
        }
    }
    public async getBlockList(index: number): Promise<{ blocks: IBlock[], length: number }> {
        try {
            const res = await this.getTopTipHeight()
            const length = Math.ceil((res.height - exodusHeight) / 20)
            res.height -= index * 20
            res.height = res.height < exodusHeight ? exodusHeight : res.height

            const response = await fetch(`${this.apiUrl}/blockList/${res.height}`)
            const blocks = await response.json()

            return { blocks, length }
        } catch (e) {
            console.log(`${e}`)
        }
    }
    public async getTopTipHeight(): Promise<{ height: number }> {
        let height: number = 0
        try {
            const response = await fetch(`${this.apiUrl}/topTipHeight/`)
            const topTipHeight = await response.json()

            height = topTipHeight.height
            return { height }
        } catch (e) {
            console.log(`${e}`)
        }
    }

    public async getAccountList(index: number): Promise<{ accounts: IAccount[], length: number }> {
        try {
            index = index === undefined ? 0 : index
            const response = await fetch(`${this.apiUrl}/accounts/${index}`)
            const res = await response.json()
            res.length = Math.ceil(res.length / 20)
            return res
        } catch (e) {
            console.log(`${e}`)
        }
    }
}
