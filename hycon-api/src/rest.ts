import * as express from "express"
export interface IResponseError {
    status: number,
    timestamp: number,
    error: string
    message: string
}

export interface IUser {
    idx: number
    uname: string
    pw: string
}

export interface ITxProp {
    hash: string
    amount: string
    estimated: string
    receiveTime?: number
    confirmation?: number
    blockHash?: string
    fee?: string
    from?: string
    to?: string
    signature?: string
}
export interface IBlock {
    hash: string
    height?: number
    txs: ITxProp[]
    timeStamp: number
    difficulty: string
    prevBlock?: string
    nonce?: string
    txSummary?: string
    resultHash?: string
    stateRoot?: string
    merkleRoot?: string
    miner?: string
}
export interface IWalletAddress {
    hash: string
    balance: string
    nonce: number
    txs: ITxProp[]
    minedBlocks?: IMinedInfo[]
    pendingAmount?: string
}
export interface IPeer {
    host: string
    port: number
    lastSeen?: string
    failCount?: number
    lastAttempt?: string
    active?: boolean
    currentQueue?: number
    location?: string
    latitude?: number
    longitude?: number
    successCount?: number
}

export interface ILocationDetails {
    location: string
    lat: number
    lng: number
    count: number
}

export interface ICreateWallet {
    passphrase?: string
    mnemonic?: string
    language?: string
    privateKey?: string
}

export interface IHyconWallet {
    name?: string
    passphrase?: string
    password?: string
    hint?: string
    mnemonic?: string
    address?: string
    balance?: string
    txs?: ITxProp[]
    language?: string
    pendingAmount?: string
    minedBlocks?: IMinedInfo[]
    index?: number
}

export interface IMinedInfo {
    blockhash: string
    timestamp: number
    miner: string
    feeReward: string
}

export interface IMiner {
    cpuHashRate: number
    cpuCount: number
    networkHashRate: number
    currentMinerAddress: string
}

export interface IRest {
    readonly version: string
    register(router: express.Router): void
}

export function checkAndRespondJSON(data: any, errorMessage: string, res: express.Response) {
    if (data === undefined) { throw new Error(errorMessage) }
    res.status(200)
    res.json(data)
    res.end()
}

export function respondNotFoundError(res: express.Response) {
    res.status(404)
    res.json({
        error: "Not Found",
        message: "Requested resource was not found",
        status: 404,
        timestamp: Date.now(),
    })
    res.end()
}

export function responseTemporaryUnavailable(res: express.Response) {
    res.status(503)
    res.json({
        error: "Temporary Unavailable",
        message: "Temploraly Unavailable, Please Retry Later ",
        status: 503,
        timestamp: Date.now(),
    })
    res.end()
}
