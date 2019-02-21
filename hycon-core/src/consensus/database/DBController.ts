import { Block, DBError, DBManager, GenesisBlock, IUncle } from "hycon-common"
import { getLogger } from "log4js"
import { Data } from "popper.js"
import { Consensus } from "../consensus"
import { Database } from "./database"
import { DBBatchServer } from "./DBbatchServer"

const logger = getLogger("DBController")

export interface IDBInput {
    block: Block,
    height: number,
    totalWork: number
    totalSupply: string
    uncles: IUncle[]

}
export class DBController {
    public dbBatch: DBBatchServer

    private hyconDB: Database
    private dbManager: DBManager

    constructor() {
        this.dbManager = new DBManager()
        this.dbBatch = new DBBatchServer()
    }

    public async init(hyconDB: Database, consensus: Consensus) {
        await this.dbManager.init("readwrite")
        this.hyconDB = hyconDB
        await this.dbBatch.init(this.dbManager, this.hyconDB, consensus)
    }

    public async genesis(genesis: GenesisBlock, height: number, totalWork: number) {
        try {
            await this.dbManager.putGenesis(genesis, height, true, totalWork)
        } catch (e) {
            if (e instanceof DBError && e.code === DBError.DUPLICATED_PRIMARY) {
                logger.debug(`GenesisBlock already in the database, Please check DB`)
                return false
            }
            logger.error(`put genesis Failed retry again : height ${height} totalWork: ${totalWork}\n ${e}`)
            setTimeout(() => this.genesis(genesis, height, totalWork), 6000)
        }
        return true
    }

    public async block(iDBInput: IDBInput) {
        try {
            await this.dbManager.putBlock(iDBInput.block, iDBInput.height, true, iDBInput.totalSupply, iDBInput.totalWork, iDBInput.uncles)
        } catch (e) {
            if (e instanceof DBError && e.code === DBError.DUPLICATED_PRIMARY) {
                logger.warn(`Already in the database, Please check DB`)
                return false
            }
            logger.warn(`putBlock Failed retry again : block ${(iDBInput.block.header)} height ${iDBInput.height} totalWork: ${iDBInput.totalWork} error ${e}`)
            setTimeout(() => this.block(iDBInput), 30000)
        }
        return true
    }
    public async orphan(iDBInput: IDBInput) {
        try {
            await this.dbManager.orphanBlock(iDBInput.block, iDBInput.height, iDBInput.totalSupply, iDBInput.totalWork, iDBInput.uncles)
        } catch (e) {
            if (e instanceof DBError && e.code === DBError.DUPLICATED_PRIMARY) {
                logger.warn(`Already reorged in the database, Please check DB`)
                return false
            }
            logger.warn(`orphan Failed retry again : block ${iDBInput.block} height ${iDBInput.height} totalWork: ${iDBInput.totalWork} error ${e}`)
            setTimeout(() => this.orphan(iDBInput), 30000)
        }
        return true
    }

}
