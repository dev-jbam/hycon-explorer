
import * as express from "express"
import { getLogger } from "log4js"
import fetch from "node-fetch"
import { IRest, respondNotFoundError } from "./rest"
const logger = getLogger("RestAPIServer: /notjson")

export class RestNotJSON implements IRest {
    public readonly version = "notjson"
    private readonly url = "https://api.hycon.io/api/v2/supply"

    constructor() { }

    public register(router: express.Router) {

        router.get("/hello", async (req: express.Request, res: express.Response) => {
            const result = { greeting: "hello" }
            res.status(200)
            res.json(result)
            res.end()
        })

        router.get("/totalSupply", async (req: express.Request, res: express.Response) => {
            try {
                const response = await fetch(this.url)
                if (response === undefined) {
                    throw new Error(`getMarketCap error`)
                }

                const { totalSupply } = await response.json()
                if (res === undefined) {
                    throw new Error(`totalSupply: express.Response is undefined error`)
                }
                res.status(200)
                res.send(totalSupply.toString())
                res.end()
            } catch (e) {
                logger.error(`Fail to totalSupply: ${e} `)
                respondNotFoundError(res)
            }
        })

        router.get("/circulatingSupply", async (req: express.Request, res: express.Response) => {
            try {
                const response = await fetch(this.url)
                if (response === undefined) {
                    throw new Error(`getMarketCap error`)
                }

                const { circulatingSupply } = await response.json()
                if (res === undefined) {
                    throw new Error(`circulatingSupply: express.Response is undefined error`)
                }
                res.status(200)
                res.send(circulatingSupply.toString())
                res.end()
            } catch (e) {
                logger.error(`Fail to circulatingSupply: ${e} `)
                respondNotFoundError(res)
            }
        })

        router.get("/maxSupply", async (req: express.Request, res: express.Response) => {
            res.status(200)
            res.send("5000000000.0")
            res.end()
        })
    }
}
