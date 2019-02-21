import * as express from "express"
import fetch from "node-fetch"
import { IRest } from "./rest"

export class RestV1 implements IRest {
    public version = "v3"

    constructor() {
    }
    public register(router: express.Router): void {
        router.all("/*", async (req: express.Request, res: express.Response) => {
            const url = `https://network.hycon.io${req.originalUrl}`
            try {
                const response = await fetch(url)
                const text = await response.text()

                res.status(response.status)
                res.send(text)
            } catch (e) {
                res.status(500)
                res.end()
            }
        })
    }
}
