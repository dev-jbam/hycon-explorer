import { AccountEntity, Address, Block, BlockEntity, DBError, DBManager, GenesisBlock, Hash, IUncle } from "hycon-common"
import { BlockHeader } from "hycon-common"
import { getLogger } from "log4js"
import { Consensus, START_HEIGHT } from "../consensus"
import { BlockStatus } from "../sync"
import { Database } from "./database"
import { DBBlock } from "./dbblock"
const logger = getLogger("DBBatch")

// tslint:disable:no-console
export class DBBatchServer {

    private dbManager: DBManager
    private hyconDB: Database
    private consensus: Consensus
    private EXTERNALDB_HEIGHT: number = 0
    private readonly checkCounts = 50000
    constructor() {

    }

    // TODO SHOUD CHANGE db AS READONLY DB CONNECTION
    public async init(dbManager: DBManager, hyconDB: Database, consensus: Consensus) {
        this.dbManager = dbManager
        this.EXTERNALDB_HEIGHT = this.dbManager.getTopTip()
        if (this.EXTERNALDB_HEIGHT === undefined || this.EXTERNALDB_HEIGHT === null) { this.EXTERNALDB_HEIGHT = -1 }
        logger.fatal(`VERIFIED BLOCK HEIGHT IN DB: ${this.EXTERNALDB_HEIGHT}`)
        this.hyconDB = hyconDB
        this.consensus = consensus
    }
    public async batchStart() {
        try {
            console.log(`batch start`)

            const consensusDBHeight = this.consensus.getBlocksTip().height

            console.time(`dbSync Batch`)
            await this.dbSyncBatchJob()
            console.timeEnd(`dbSync Batch`)

            console.time(`${this.checkCounts} Blocks`)
            await this.checkBlocks(this.checkCounts)
            console.timeEnd(`${this.checkCounts} Blocks`)

            if (consensusDBHeight && consensusDBHeight !== 0) {
                console.time(`all MissedBlock`)
                await this.checkAndRequiestMissedBlock(consensusDBHeight)
                console.timeEnd(`all MissedBlock`)

                console.time(`all Accounts`)
                await this.checkAllAccounts(true)
                console.timeEnd(`all Accounts`)
            }
        } catch (e) {
            logger.error(`DB data and Blockchain node data are different, Please check it ${e && e.stack}`)
            await this.dbSyncBatchJob()
        }

    }

    public async checkAndRequiestMissedBlock(topHeight: number) {
        console.log(`check start external DB: DB TIP ${this.EXTERNALDB_HEIGHT} BC TIP ${topHeight}`)
        if (topHeight > this.EXTERNALDB_HEIGHT) {
            await this.missedBlockBatch(this.EXTERNALDB_HEIGHT + 1, topHeight - this.EXTERNALDB_HEIGHT)
        }
    }

    public async checkAllAccounts(update: boolean = false) {
        try {
            const connection = this.dbManager.getConnection()
            await connection.manager.transaction("SERIALIZABLE", async (manager) => {
                const accountEntities = await manager.find(AccountEntity)
                const updateEntities: AccountEntity[] = []
                let i = 0
                for (const account of accountEntities) {
                    if (!account.address.startsWith("H")) {
                        continue
                    }
                    const address = new Address(account.address)
                    const accountWorldstate = await this.consensus.getAccount(address)

                    if (account === undefined || accountWorldstate === undefined) {
                        logger.error(`undefined worldstate ${account.address}`)
                        continue
                    }
                    if (
                        account.balance !== accountWorldstate.balance.toString() ||
                        account.nonce !== accountWorldstate.nonce
                    ) {
                        logger.fatal(`${account.address} DIFFERENCE BALANCE: ${account.balance} === ${accountWorldstate.balance} NONCE: ${account.nonce} : ${accountWorldstate.nonce}`)
                        if (update) {
                            account.balance = accountWorldstate.balance.toString()
                            account.nonce = accountWorldstate.nonce
                            updateEntities.push(account)
                        }
                    }
                    i++
                }
                if (update && updateEntities.length > 0) {
                    console.log(`update acounts start ${updateEntities.length}`)
                    console.time(`save accounts`)
                    await manager.save(updateEntities)
                    console.timeEnd(`save accounts`)
                }
                console.log(`TEST SUCCESS TOTAL : ${i} ACCOUNT`)
            })
        } catch (e) {
            logger.error(`[FAILED] ${e + e.stack}`)
        }

    }

    public async checkBlocks(count: number, update?: boolean) {
        let blocks: BlockEntity[] = []
        try {
            const targetHeight = this.EXTERNALDB_HEIGHT - count < 0 ? 0 : this.EXTERNALDB_HEIGHT - count
            blocks = await this.dbManager.getConnection().manager.createQueryBuilder(BlockEntity, "block")
                .where(`block.isMain=true and block.height > :targetHeight`, { targetHeight })
                .orderBy("height")
                .getMany()

            for (const blockEntity of blocks) {
                let targetHash = Hash.decode(blockEntity.blockhash)
                const targetStatus = await this.hyconDB.getBlockStatus(targetHash)
                if (targetStatus !== BlockStatus.MainChain) {
                    targetHash = await this.hyconDB.getHashAtHeight(blockEntity.height)
                    blockEntity.isMain = false
                    await this.dbManager.getConnection().manager.save(blockEntity)
                }
                const dbblock = await this.hyconDB.getDBBlock(targetHash)
                if (dbblock === undefined) { throw new Error("DB and BC node has different information, DB might have more data") }
                const realblock = await this.hyconDB.dbBlockToBlock(dbblock) as Block
                const blockhash = new Hash(dbblock.header).toString()
                if (
                    blockEntity.height !== dbblock.height ||
                    blockEntity.blockhash !== blockhash ||
                    blockEntity.txCount !== realblock.txs.length ||
                    (realblock instanceof Block && realblock.header.previousHash.length - 1 !== blockEntity.uncleCount)
                ) {
                    logger.fatal(`Block is not same  DB     BC \n
                     height ${blockEntity.height} : ${dbblock.height}\n
                      hash ${blockEntity.blockhash} : ${blockhash}\n
                       txs ${blockEntity.txCount} : ${realblock.txs.length}
                    `)
                    if (update) {
                        let uncles: IUncle[] = []
                        if (!(realblock instanceof GenesisBlock)) {
                            // @ts-ignore
                            uncles = await this.getIUncles(dbblock.height, (realblock.header as BlockHeader).previousHash)
                        }
                        await this.dbManager.putBlock(realblock as Block, dbblock.height, true, dbblock.totalSupply.toString(), dbblock.totalWork, uncles)
                        logger.fatal(`Modified the block`)
                    }
                }
            }

        } catch (e) {
            logger.fatal("checkBlocks Failed", e)
        }
    }
    public async dbSyncBatchJob() {

        let blocks: BlockEntity[] = []
        try {
            const heightLimit = START_HEIGHT
            blocks = await this.dbManager.getConnection().manager.createQueryBuilder(BlockEntity, "block")
                .where(`block.isMain=true`)
                .andWhere(`height > :heightLimit`, { heightLimit })
                .orderBy("height")
                .getMany()

            for (let i = 1; i < blocks.length; ++i) {
                const cur = blocks[i]
                const prev = blocks[i - 1]
                if (cur.height - prev.height !== 1) {
                    // reorg
                    if (cur.height === prev.height && i + 1 < blocks.length) {
                        const nextIdx = i + 1
                        const target = blocks[nextIdx].previousHash === cur.blockhash ? prev : cur
                        logger.info(`[REORGED] ${JSON.stringify(target)}\n among  'height': ${prev.height}, prev.blockhash ${prev.blockhash}} and 'height': ${cur.height}, prev.blockhash ${cur.blockhash}}`)
                        await this.reorgBlockBatch(target.blockhash, target.height, target.totalWork)
                    } else {
                        const arr = Array.from({ length: cur.height - prev.height - 1 }, (v, k) => prev.height + k + 1)
                        logger.info(`[MISSED BLOCK] ${JSON.stringify(arr)} between \n${JSON.stringify(prev)} \n${JSON.stringify(cur)}`)
                        await this.missedBlockBatch(prev.height + 1, cur.height - prev.height - 1)
                    }
                }
            }
        } catch (e) {
            logger.error(`dbSyncBatchJob Fail: ${e}`)
            throw e
        }
    }

    private async reorgBlockBatch(blockHash: string, height: number, totalWork: number) {
        const hash = Hash.decode(blockHash)
        logger.info(`hash ${hash.toString()} : string : ${blockHash}`)
        const dbblock = await this.hyconDB.getDBBlock(hash)
        const block = await this.hyconDB.dbBlockToBlock(dbblock)
        // @ts-ignore
        const uncles = await this.getIUncles(dbblock.height, (block.header as BlockHeader).previousHash)
        this.dbManager.orphanBlock(block as Block, height, dbblock.totalSupply.toString(), totalWork, uncles)
    }
    private async missedBlockBatch(height: number, count: number) {
        let dbBlocks: DBBlock[] = []
        dbBlocks = await this.hyconDB.getDBBlocksRange(height, count)
        for (const dbblock of dbBlocks) {
            const block = await this.hyconDB.dbBlockToBlock(dbblock)
            try {
                if (dbblock.height === 0 || dbblock.height === START_HEIGHT) {
                    await this.dbManager.putGenesis(block as GenesisBlock, dbblock.height, true, dbblock.totalWork)
                    continue
                }
                // @ts-ignore
                const uncles = await this.getIUncles(dbblock.height, (block.header as BlockHeader).previousHash)
                await this.dbManager.putBlock(block as Block, dbblock.height, true, dbblock.totalSupply.toString(), dbblock.totalWork, uncles)
            } catch (e) {
                if (e instanceof DBError && e.code === DBError.DUPLICATED_PRIMARY) {
                    continue
                }
                throw e
            }
        }
    }

    private async getIUncles(foundBlockHeight: number, previousHash: Uint8Array[]) {
        const uncleHashes = previousHash.slice(1)
        const uncles: IUncle[] = []

        for (const uncleHash of uncleHashes) {
            const hash = new Hash(uncleHash)
            const uncleDBBlock = await this.hyconDB.getDBBlock(hash)
            uncles.push({
                depth: foundBlockHeight - uncleDBBlock.height,
                difficulty: uncleDBBlock.header.difficulty.toString(),
                hash: hash.toString(),
                // @ts-ignore
                miner: new Address((uncleDBBlock.header as BlockHeader).miner),
                timeStamp: uncleDBBlock.header.timeStamp,
            })
        }
        return uncles
    }
}
