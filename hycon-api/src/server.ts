import * as bodyParser from "body-parser"
import * as timeout from "connect-timeout"
import * as express from "express"
import { getLogger } from "log4js"
import { IRest, respondNotFoundError, responseTemporaryUnavailable } from "./rest"
import { RestNotJSON } from "./restnotjson"
import { RestV1 } from "./restv1"
import { RestV2 } from "./restv2"
const logger = getLogger("RestClient")

export class HttpServer {
    public app: express.Application

    constructor(port: number = 80) {
        this.app = express()

        this.app.use(timeout("5s"))
        this.app.use(bodyParser.json())

        this.app.all("/*", (req: express.Request, res: express.Response, next: express.NextFunction) => {
            res.header("Access-Control-Allow-Origin", "*")
            res.header("Access-Control-Allow-Methods", "GET, POST")
            res.header("Access-Control-Allow-Headers", "Accept")
            if (req.method === "OPTIONS") {
                res.status(200).end()
            } else {
                next()
            }
        })
        this.registerRest(new RestV2())
        this.registerRest(new RestV1())
        this.registerRest(new RestNotJSON())
        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            respondNotFoundError(res)
        })
        this.app.use(this.timeoutResponse)
        this.app.listen(port)
    }

    private timeoutResponse(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (!req.timedout) {
            next()
        } else {
            logger.error(`requested url ${req.originalUrl} timeout ${req.ips} body ${req.body} params${req.params}`)
            responseTemporaryUnavailable(res)
        }
    }
    private registerRest(rest: IRest) {
        const router = express.Router()
        rest.register(router)
        this.app.use(`/api/${rest.version}`, router)
        logger.info(`Started RESTful API ${rest.version}`)
    }
}
