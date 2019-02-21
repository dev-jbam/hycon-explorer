import { getLogger } from "log4js"
import Long = require("long")
import { Connection, createConnection, EntityManager, getConnectionOptions } from "typeorm"
import { DBError, hycontoString } from ".."
import { AsyncLock } from "../common/asyncLock"
import { Block } from "../common/block"
import { GenesisBlock } from "../common/blockGenesis"
import { ConsensusFactor } from "../common/consensusFactor"
import { Hash } from "../util/hash"
import { AccountEntity } from "./entity/accountEntity"
import { BlockEntity } from "./entity/blockEntity"
import { InfoEntity } from "./entity/infoEntity"
import { TxEntity } from "./entity/txEntity"
import { IUncle, UncleEntity } from "./entity/uncleEntity"
import { AccountRepository } from "./repository/AccountRepository"
import { BlockRepository } from "./repository/BlockRepository"
import { InfoRepository } from "./repository/InfoRepository"
import { TxRepository } from "./repository/TxRepository"
import { UncleRepository } from "./repository/UncleRepository"
const logger = getLogger("DBManager")

export function toValueArray<T>(setOrMap: Map<any, T> | Set<T>) {
    const values: T[] = []
    for (const value of setOrMap.values()) {
        values.push(value)
    }
    return values
}

export class DBManager {
    private connection: Connection
    private lock: AsyncLock

    private recentInfo: InfoEntity
    private totalUncleReward: Long
    private readonly limiter = 20

    private blockRepo: BlockRepository
    private accountRepo: AccountRepository
    private txRepo: TxRepository
    private infoRepo: InfoRepository
    private uncleRepo: UncleRepository

    // airdropAddr, icoAddr, corpAddr, teamAddr, bountyAddr, developAddr
    private readonly nonMarketAddress: string[] = ["H3nHqmqsamhY9LLm87GKLuXfke6gg8QmM", "H3ynYLh9SkRCTnH59ZdU9YzrzzPVL5R1K", "H8coFUhRwbY9wKhi6GGXQ2PzooqdE52c", "H3r7mH8PVCjJF2CUj8JYu8L4umkayCC1e", "H278osmYQoWP8nnrvNypWB5YfDNk6Fuqb", "H4C2pYMHygAtSungDKmZuHhfYzjkiAdY5"]

    constructor() {
        this.lock = new AsyncLock(1)
        this.totalUncleReward = Long.UZERO
        this.recentInfo = new InfoEntity()
    }
    public async init(optionName: string = "default") {
        try {
            const options = await getConnectionOptions(optionName)
            this.connection = await createConnection(options)

            await this.initRepositories()

            this.lock.releaseLock()
            await this.renewInfors()

            if (optionName === "readwrite") {
                this.updateInfoTable()
            }
        } catch (e) {
            logger.error(`Replication DB initialization error: ${e.stack}`)
            throw e
        }
    }

    public getConnection() {
        return this.connection
    }

    public getTopTip() {
        return this.recentInfo.tipHeight
    }

    public getTotalAccounts() {
        return this.recentInfo.totalAccounts
    }

    public get24hoursTxsCount() {
        return this.recentInfo.dailyTxsCount
    }

    public async putGenesis(block: GenesisBlock, height: number, isMain: boolean, totalWork: number) {
        try {
            await this.lock.critical(async () => {
                await this.connection.manager.transaction("SERIALIZABLE", async (manager) => {
                    const genesisEntity = new BlockEntity()
                    genesisEntity.genesisToEntityMapper(block, height, true)
                    const isExist = await manager.findOne(BlockEntity, { blockhash: (new Hash(block.header)).toString() })

                    if (isExist !== undefined) {
                        throw new DBError(DBError.DUPLICATED_PRIMARY)
                    }

                    const txsResult = await manager.save(genesisEntity.txs)

                    for (const tx of txsResult) {
                        const accountEntity = new AccountEntity(tx.to, tx.amount, 0)
                        await manager.save(accountEntity)
                    }
                    await manager.save(new AccountEntity("minted", "0", txsResult.length))
                    genesisEntity.totalWork = totalWork
                    const blockResult = await manager.insert(BlockEntity, genesisEntity)
                    logger.debug(`genesis insert ${blockResult}`)
                    await manager.save(BlockEntity, genesisEntity)
                })
            })
        } catch (e) {
            logger.error(`Failed to putGenesis ${e}`)
            throw e
        }
    }
    public async putBlock(block: Block, height: number, isMain: boolean, totalSupply: string, totalWork: number, uncles: IUncle[]) {
        const hash = new Hash(block.header)
        try {
            await this.lock.critical(async () => {
                await this.connection.manager.transaction("SERIALIZABLE", async (manager) => {
                    const blockEntity = new BlockEntity(block, height, isMain, totalWork, uncles)
                    const accountEntityMap = await this.getAccountEntities(manager, blockEntity.miner, blockEntity.txs, uncles)

                    for (const tx of blockEntity.txs) {
                        tx.process(accountEntityMap)
                    }
                    const fee = Long.fromString(blockEntity.totalFee, true)
                    const minerAcount = accountEntityMap.get(blockEntity.miner)
                    const mineReward = ConsensusFactor.getReward(height)
                    minerAcount.addBalance(mineReward, fee)

                    for (const uncle of uncles) {
                        const uncleAccountEntity = accountEntityMap.get(uncle.miner.toString())
                        uncleAccountEntity.addBalance(ConsensusFactor.uncleReward(mineReward, uncle.depth))
                    }
                    accountEntityMap.delete("")
                    const accountEntities = toValueArray(accountEntityMap)
                    blockEntity.totalSupply = totalSupply
                    await manager.save(blockEntity.txs)
                    await manager.save(blockEntity.uncles)
                    await manager.save(blockEntity)
                    await manager.getCustomRepository(AccountRepository).saveAccounts(accountEntities, blockEntity.blockTimeStamp)
                })
            })
        } catch (e) {
            logger.error(`putBlock Transaction Error: ${e && e.stack ? e.stack : ""}`)
            throw e
        }
        this.recentInfo.tipHeight = height
    }

    public async orphanBlock(block: Block, height: number, totalSupply: string, totalWork: number, uncles: IUncle[]) {
        try {
            await this.lock.critical(async () => {
                await this.connection.manager.transaction("SERIALIZABLE", async (manager) => {
                    const blockEntity = new BlockEntity(block, height, false, totalWork, uncles)
                    await manager.save(blockEntity.uncles)
                    await manager.save(blockEntity)

                    const accountEntityMap = await this.getAccountEntities(manager, blockEntity.miner, blockEntity.txs, uncles)

                    for (const tx of blockEntity.txs) {
                        tx.reverse(accountEntityMap)
                        tx.from = "orphan"
                        tx.to = "orphan"
                        tx.blockhash = "orphan" + tx.blockhash
                    }

                    const fee = Long.fromString(blockEntity.totalFee, true)
                    const minerAcount = accountEntityMap.get(blockEntity.miner)
                    const mineReward = ConsensusFactor.getReward(height)

                    minerAcount.substractBalance(mineReward, fee)

                    for (const uncle of uncles) {
                        const uncleAccountEntity = accountEntityMap.get(uncle.miner.toString())
                        uncleAccountEntity.substractBalance(ConsensusFactor.uncleReward(mineReward, uncle.depth))
                    }
                    accountEntityMap.delete("")
                    const accountEntities = toValueArray(accountEntityMap)
                    await manager.save(blockEntity.txs)
                    await manager.getCustomRepository(AccountRepository).saveAccounts(accountEntities, blockEntity.blockTimeStamp)
                })
            })
        } catch (e) {
            logger.error(`orphan Transaction Error: ${e && e.stack ? e.stack : ""}`)
            throw e
        }

    }

    public async getMarketCap(): Promise<{ totalSupply: string, circulatingSupply: string }> {
        try {
            const block = await this.blockRepo.findOne({ height: this.recentInfo.tipHeight })
            const totalAmount = Long.fromString(block.totalSupply, true)
            const nonMarketCoins = await this.accountRepo.getSumBalance(this.nonMarketAddress)
            return { totalSupply: hycontoString(totalAmount), circulatingSupply: hycontoString(totalAmount.sub(nonMarketCoins)) }
        } catch (e) {
            logger.warn(`Error: getMarketCap() ${e}`)
        }
    }

    public async getMinedBlocks(targetMiner: string, targetHeight?: number, pageNumber?: number) {
        return await this.blockRepo.getMinedBlocks(targetMiner, this.limiter, pageNumber)
    }

    public async getMinedUncles(targetMiner: string, targetHeight?: number, pageNumber?: number) {
        const uncles = this.uncleRepo.getMinedUncles(targetMiner, this.limiter, pageNumber)
        return uncles
    }

    public async getTx(txHash: string) {
        try {
            const tx = await this.txRepo.findOne({ txHash })
            if (tx === undefined) {
                throw new Error(`tx not found Error: ${txHash}`)
            }
            const blockHeight: number = await this.blockRepo.getBlockHeight(tx.blockhash)
            const confirmations = blockHeight === -1 ? blockHeight : this.recentInfo.tipHeight - blockHeight
            return {
                amount: tx.amount,
                blockTimeStamp: tx.blockTimeStamp,
                blockhash: tx.blockhash,
                confirmations,
                fee: tx.fee,
                from: tx.from,
                nonce: tx.nonce,
                to: tx.to,
                txHash: tx.txHash,
            }
        } catch (e) {
            logger.warn(`getTx Error: ${e}`)
        }
    }

    public async getTxs(targetAddress: string, pageNumber: number) {
        const txs = await this.txRepo.getTxs(targetAddress, pageNumber, this.limiter)
        return txs
    }
    public async getAllTxsbyBlockHash(blockhash: string) {
        const txs = await this.txRepo.getTxsByBlockhash(blockhash)
        return txs
    }

    public async getAccounts(index?: number) {
        index = index === undefined ? 0 : index
        return await this.accountRepo.getAccounts(this.limiter, index)
    }

    public async getBlockAndData(hashOrHeight: string) {
        const regexp = /^[0-9]*$/
        let block: BlockEntity
        if (regexp.test(hashOrHeight)) {
            const height = Number(hashOrHeight) < this.blockRepo.minHeight ? this.blockRepo.minHeight : Number(hashOrHeight)
            block = await this.blockRepo.getBlockAndDatabyHeight(height)
        } else {
            block = await this.blockRepo.getBlockAndData(hashOrHeight)
        }
        if (block === undefined) { return block }

        for (const tx of block.txs) {
            delete tx.signature
        }
        const mainUncle: UncleEntity[] = []
        for (const uncle of block.uncles) {
            if (uncle.isUncle) {
                mainUncle.push(uncle)
            }
        }
        block.uncles = mainUncle
        return block
    }
    public async getBlock(blockhash: string) {
        try {
            return await this.blockRepo.findOneOrFail({ blockhash })
        } catch (e) {
            logger.error(`getBlock failed blockhash: ${blockhash} ERROR: ${e} `)
        }
    }

    public async getUncle(uncleHash: string) {
        try {
            return await this.connection.manager.findOne(UncleEntity, { uncleHash })
        } catch (e) {
            logger.error(`getUncle failed uncleHash: ${uncleHash} ERROR: ${e} `)
        }
    }

    public async getBlockHeight(targetHash: string) {
        return await this.blockRepo.getBlockHeight(targetHash)
    }

    public async getBlockList(targetHeight?: number) {
        targetHeight = targetHeight === undefined ? this.recentInfo.tipHeight : targetHeight
        return await this.blockRepo.getBLockList(targetHeight, this.limiter)
    }

    // tslint:disable-next-line:no-shadowed-variable
    public async getAddress(address: string) {
        try {
            return await this.accountRepo.findOne({ address })
        } catch (e) {
            logger.warn(`getAddress failed address: ${address} ERROR: ${e} `)
        }
    }
    public async getRecentInfo() {
        return await this.infoRepo.getRecentInfo()
    }

    private async initRepositories() {
        this.accountRepo = this.connection.getCustomRepository(AccountRepository)
        this.blockRepo = this.connection.getCustomRepository(BlockRepository)
        this.infoRepo = this.connection.getCustomRepository(InfoRepository)
        this.txRepo = this.connection.getCustomRepository(TxRepository)
        this.uncleRepo = this.connection.getCustomRepository(UncleRepository)
        await this.blockRepo.init()
    }

    private async updateInfoTable() {
        this.recentInfo.totalTxs = (await this.txRepo.getTotalTxs()).toString()
        this.recentInfo.totalMinedReward = this.getTotalMinedHycon().toString()
        const newInfo = await this.infoRepo.createAndSave(this.recentInfo)
        this.recentInfo = newInfo === undefined ? this.recentInfo : newInfo
        setTimeout(() => this.updateInfoTable(), 60 * 60 * 1000)
    }

    private async renewInfors() {
        const infor = await this.infoRepo.getRecentInfo()
        this.recentInfo = infor === undefined ? this.recentInfo : infor
        await this.renewTopTipHeight()
        await this.renewTotalAccounts()
        await this.renewTotalUncleReward()
        await this.renew24HourTotalTxs()
        await this.renewMonthlyActiveAccounts()
    }

    private async renewTopTipHeight() {
        this.recentInfo.tipHeight = await this.blockRepo.getTopTipHeight()
        setTimeout(() => this.renewTopTipHeight(), 15 * 1000)
    }
    private async renewTotalAccounts() {
        this.recentInfo.totalAccounts = await this.accountRepo.getTotalAccounts()
        setTimeout(() => this.renewTotalAccounts(), 2 * 60 * 1000)
    }

    private async renewMonthlyActiveAccounts() {
        this.recentInfo.monthlyActiveAccounts = await this.accountRepo.getMonthlyActiveAccounts()
        setTimeout(() => this.renewMonthlyActiveAccounts(), 10 * 60 * 1000)
    }

    private async renew24HourTotalTxs() {
        this.recentInfo.dailyTxsCount = await this.txRepo.getDailyTxs()
        setTimeout(() => this.renew24HourTotalTxs(), 5 * 60 * 1000)
    }

    private async renewTotalUncleReward() {
        const uncles: UncleEntity[] = await this.uncleRepo.getUncles(ConsensusFactor.lastNakamotoBlock)
        let uncleReward = Long.UZERO
        for (const uncle of uncles) {
            uncleReward = uncleReward.add(ConsensusFactor.uncleReward(ConsensusFactor.getReward(uncle.height + uncle.depth), uncle.depth))
        }
        this.totalUncleReward = uncleReward
        setTimeout(() => this.renewTotalUncleReward(), 10 * 60 * 1000)
    }

    private getTotalMinedHycon() {
        const maxIntegerCount = 8e6
        let totalAmount = Long.UZERO
        let nakamotoBlocks = this.recentInfo.tipHeight
        let ghostBlocks = 0
        let jabiruBlocks = 0
        if (this.recentInfo.tipHeight > ConsensusFactor.lastNakamotoBlock) {
            nakamotoBlocks = ConsensusFactor.lastNakamotoBlock
            ghostBlocks = this.recentInfo.tipHeight - nakamotoBlocks
        }
        if (this.recentInfo.tipHeight > ConsensusFactor.lastGhostBlock) {
            jabiruBlocks = ghostBlocks - ConsensusFactor.lastGhostBlock
            ghostBlocks -= jabiruBlocks
        }
        let integerCount = Math.ceil(jabiruBlocks / maxIntegerCount)
        totalAmount = totalAmount.add(Long.fromNumber((nakamotoBlocks) * 240).multiply(1e9))
        totalAmount = totalAmount.add(Long.fromNumber((ghostBlocks) * 120).multiply(1e9))
        totalAmount = totalAmount.add(Long.fromNumber((jabiruBlocks) * 12).multiply(1e9))
        totalAmount = totalAmount.add(this.totalUncleReward)

        while (integerCount > 0) {
            totalAmount = totalAmount.add(Long.fromNumber(120 * maxIntegerCount).multiply(1e9))
            integerCount--
        }
        return totalAmount
    }
    private async getAccountEntities(manager: EntityManager, minerAddress: string, txs: TxEntity[], uncles: IUncle[]): Promise<Map<string, AccountEntity>> {
        const addresses = new Set<string>([minerAddress])
        const accountEntityMap: Map<string, AccountEntity> = new Map<string, AccountEntity>()
        try {
            for (const tx of txs) {
                addresses.add(tx.from)
                addresses.add(tx.to)
            }
            for (const uncle of uncles) {
                addresses.add(uncle.miner.toString())
            }
            const searchAddresses: string[] = toValueArray(addresses)
            const accounts = await manager.getCustomRepository(AccountRepository).findByIds(searchAddresses)
            for (const account of accounts) {
                addresses.delete(account.address)
                accountEntityMap.set(account.address, account)
            }

            for (const newAddress of addresses) {
                const accountEntity = new AccountEntity(newAddress, "0", 0)
                accountEntityMap.set(newAddress, accountEntity)
            }

        } catch (e) {
            logger.error(`getAccountsEntities Error: ${e && e.stack ? e.stack : ""}) `)
            throw e
        }
        return accountEntityMap
    }

}
