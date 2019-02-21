import { getLogger } from "log4js"
import { EntityRepository, Repository } from "typeorm"
import { ConsensusFactor } from "../../common/consensusFactor"
import { BlockEntity } from "../entity/blockEntity"
const logger = getLogger("BlockRepository")

@EntityRepository(BlockEntity)
export class BlockRepository extends Repository<BlockEntity> {
    public minHeight: number
    public async init() {
        this.minHeight = await this.getMinHeight()
        this.minHeight = this.minHeight === ConsensusFactor.exodusHeight ? this.minHeight + 1 : this.minHeight
    }
    public async getBlockAndData(blockhash: string) {
        try {
            const block: BlockEntity = await this.findOne({
                cache: 5 * 1000,
                relations: ["txs", "uncles"],
                where: { blockhash, isMain: true },
            })
            return block
        } catch (e) {
            logger.warn(`getBlockAndTxs ${e} `)
        }
    }

    public async getBlockAndDatabyHeight(height: number) {
        try {
            const block: BlockEntity = await this.findOne({
                cache: 5 * 1000,
                relations: ["txs", "uncles"],
                where: { height, isMain: true },
            })
            return block
        } catch (e) {
            logger.error("getBlockAndTxsbyHeight", e)
        }
    }
    public async getBlockHeight(targetHash: string) {
        try {
            const entity = await this.findOne({
                select: { height: true },
                where: { blockhash: targetHash },
            })
            if (entity === undefined) {
                throw new Error("block height not found")
            }
            return entity.height
        } catch (e) {
            logger.warn("getBlockHeight failed blockhash = ${targetHash} ERROR:", e)
        }
        return -1
    }

    public async getTopTipHeight() {
        try {
            const topBlockHeight = await this.query(`select max(height) as height from block where isMain = true`)
            return topBlockHeight === undefined ? 0 : topBlockHeight[0][`height`]
        } catch (e) {
            logger.warn(`getTopTipHeight failed ${e} `)
        }
    }

    public async getMinHeight() {
        try {
            const minHeight = await this.query(`select min(height) as height from block where isMain = true`)
            return minHeight === undefined ? undefined : minHeight[0][`height`]
        } catch (e) {
            logger.warn("getTopTipHeight failed", e)
        }
    }

    public async getBLockList(targetHeight: number, limit: number) {
        try {
            const blocks = await this.createQueryBuilder()
                .where("height <= :targetHeight and isMain=true", { targetHeight })
                .cache(3 * 1000)
                .addOrderBy(`height`, "DESC")
                .limit(limit)
                .getMany()

            return blocks
        } catch (e) {
            logger.warn("getBlockList failed height: ${targetHeight} ERROR:", e)
        }
    }

    public async getMinedBlocks(targetMiner: string, limit: number, pageNumber?: number) {
        try {
            pageNumber = pageNumber === undefined ? 0 : pageNumber
            const blocks = await this.createQueryBuilder()
                .select(`height, blockhash, blockTimeStamp, miner, totalFee as feeReward`)
                .where(` miner=:targetMiner and isMain=true`, { targetMiner })
                .orderBy(`height`, "DESC")
                .offset(Number(pageNumber * limit)).limit(limit)
                .execute()

            if (blocks === undefined) {
                throw new Error("getMinedBlocks Not Found")
            }
            return blocks
        } catch (e) {
            logger.warn("getMinedBlocks Failed", e)
        }
    }

}
