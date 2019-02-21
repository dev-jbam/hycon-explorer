import * as express from "express"
import { getLogger } from "log4js"
import fetch from "node-fetch"
import { IRest } from "./rest"
import { respondNotFoundError } from "./rest"
const logger = getLogger("RestAPIServer: /v1")

export class RestV1 implements IRest {
    public version = "v1"
    constructor() { }
    public register(router: express.Router): void {
        router.get("/getMarketCap", async (req: express.Request, res: express.Response) => {
            const url = `https://api.hycon.io/api/v2/supply`
            try {
                const response = await fetch(url)
                if (response === undefined) {
                    throw new Error(`getMarketCap error`)
                }
                const result = await response.json()
                res.status(200)
                res.json({ amount: result.totalSupply })
                res.end()
            } catch (e) {
                logger.error(`getMarketCap error: ${e}`)
                respondNotFoundError(res)
            }
        })

        router.all("/*", async (req: express.Request, res: express.Response) => {
            const url = `https://network.hycon.io${req.originalUrl}`
            try {
                const response = await fetch(url)
                const text = await response.text()

                res.status(response.status)
                res.send(text)
            } catch (e) {
                logger.error(`api/v1/ error ${e} `)
                respondNotFoundError(res)
            }
        })
    }
}
