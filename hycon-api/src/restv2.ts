import * as express from "express"
import { DBManager } from "hycon-common"
import { getLogger } from "log4js"
import { checkAndRespondJSON, IRest, respondNotFoundError } from "./rest"
const logger = getLogger("RestAPIServer")

export class RestV2 implements IRest {
    public readonly version = "v2"
    private db: DBManager

    constructor() {
        this.db = new DBManager()
        this.db.init("readonly")
    }

    public register(router: express.Router) {

        router.get("/hello", async (req: express.Request, res: express.Response) => {
            const result = { greeting: "hello" }
            res.status(200)
            res.json(result)
            res.end()
        })

        router.get("/supply", async (req: express.Request, res: express.Response) => {
            try {
                let supply = await this.db.getMarketCap()
                supply = Object.assign({ maxSupply: "5000000000.0" }, supply)
                checkAndRespondJSON(supply, `supply error`, res)
            } catch (e) {
                logger.warn(`Fail to supply: ${e} `)
                respondNotFoundError(res)
            }

        })

        router.get("/tx/:hash", async (req: express.Request, res: express.Response) => {
            try {
                const tx = await this.db.getTx(req.params.hash)
                checkAndRespondJSON(tx, `tx/${req.params.hash} error`, res)
            } catch (e) {
                logger.warn(`Fail to /tx/${req.params.hash}: ${e} `)
                respondNotFoundError(res)
            }

        })

        router.get("/nextTxs/:address/:page", async (req: express.Request, res: express.Response) => {
            try {
                const txs = await this.db.getTxs(req.params.address, req.params.page)
                checkAndRespondJSON(txs, `txs not found address: ${req.params.address} page${req.params.page}`, res)
            } catch (e) {
                logger.warn(`Fail to /tx/${req.params.hash}: ${e} `)
                respondNotFoundError(res)
            }
        })

        router.get("/address/:address", async (req: express.Request, res: express.Response) => {
            try {
                const account = await this.db.getAddress(req.params.address)
                if (account === undefined) {
                    throw new Error(`account not found Error /account/${req.params.address}`)
                }
                const txs = await this.db.getTxs(account.address, 0)
                for (const tx of txs) {
                    delete tx.signature
                }
                res.status(200)
                res.json({
                    address: account.address,
                    balance: account.balance,
                    nonce: account.nonce,
                    txs,
                })
                res.end()
            } catch (e) {
                logger.warn(`Fail to getTxs: ${e} `)
                respondNotFoundError(res)
            }
        })
        router.get("/block/height/:height", async (req: express.Request, res: express.Response) => {
            try {
                const block = await this.db.getBlockAndData(req.params.height)
                checkAndRespondJSON(block, `block not found height: ${req.params.height}`, res)
            } catch (e) {
                logger.warn(`Fail to getBlockAndData: with height ${req.params.height} ${e} `)
                respondNotFoundError(res)
            }
        })
        router.get("/block/:hashorheight", async (req: express.Request, res: express.Response) => {
            try {
                const block = await this.db.getBlockAndData(req.params.hashorheight)
                checkAndRespondJSON(block, `block not found hashorheight: ${req.params.hashorheight}`, res)
            } catch (e) {
                logger.warn(`Fail to getBlockAndData: ${e} `)
                respondNotFoundError(res)
            }
        })

        router.get("/uncle/:hash", async (req: express.Request, res: express.Response) => {
            try {
                const uncle = await this.db.getUncle(req.params.hash)
                delete uncle.isUncle
                checkAndRespondJSON(uncle, `uncle not found ${req.params.hash}`, res)
            } catch (e) {
                logger.warn(`Fail to getUncle: ${e} `)
                respondNotFoundError(res)
            }
        })

        router.get("/block/:hash/txs", async (req: express.Request, res: express.Response) => {
            try {
                const txs = await this.db.getAllTxsbyBlockHash(req.params.hash)
                for (const tx of txs) {
                    delete tx.signature
                }
                checkAndRespondJSON(txs, "txs not found", res)
            } catch (e) {
                logger.warn(`Fail to getAllTxsByBlockHash: ${e} `)
                respondNotFoundError(res)
            }
        })

        router.get("/topTipHeight", async (req: express.Request, res: express.Response) => {
            let height = 0
            try {
                height = await this.db.getTopTip()
                checkAndRespondJSON({ height }, "height is undefined", res)
            } catch (e) {
                logger.warn(`Fail to getTopTipHeight: ${e} `)
                respondNotFoundError(res)
            }
        })

        router.get("/blockList/:height", async (req: express.Request, res: express.Response) => {
            try {
                const blocks = await this.db.getBlockList(req.params.height)
                checkAndRespondJSON(blocks, `blockList Cannot find Blocks: params ${JSON.stringify(req.params)}`, res)
            } catch (e) {
                logger.warn(`Failed to getBlockList: ${e} `)
                respondNotFoundError(res)
            }
        })

        router.get("/accounts/:index", async (req: express.Request, res: express.Response) => {
            try {
                const index = req.params.index === undefined ? 0 : req.params.index
                const accounts = await this.db.getAccounts(index)

                const length = this.db.getTotalAccounts()
                checkAndRespondJSON({ accounts, length }, `Accounts List not found: params ${JSON.stringify(req.params)} `, res)
            } catch (e) {
                logger.warn(`Failed to getAccounts: ${e} `)
                respondNotFoundError(res)
            }
        })

        router.get("/minedBlocks/:address/:height/:idx", async (req: express.Request, res: express.Response) => {
            try {
                const blocks = await this.db.getMinedBlocks(req.params.address, Number(req.params.height), req.params.idx)
                checkAndRespondJSON(blocks, "minedBlocks are undefined", res)
            } catch (e) {
                logger.warn(`Failed to getMinedBlocks : ${e} `)
                respondNotFoundError(res)
            }
        })

        router.get("/minedUncles/:address/:height/:idx", async (req: express.Request, res: express.Response) => {
            try {
                const uncles = await this.db.getMinedUncles(req.params.address, Number(req.params.height), req.params.idx)
                checkAndRespondJSON(uncles, "uncles are undefined", res)
            } catch (e) {
                logger.warn(`Failed to getMinedBlocks : ${e} `)
                respondNotFoundError(res)
            }
        })

        router.get("/recentinfo", async (req: express.Request, res: express.Response) => {
            try {
                const info = await this.db.getRecentInfo()
                checkAndRespondJSON(info, "info is undefined", res)
            } catch (e) {
                logger.warn(`Failed to getMinedBlocks : ${e} `)
                respondNotFoundError(res)
            }
        })

    }

}
