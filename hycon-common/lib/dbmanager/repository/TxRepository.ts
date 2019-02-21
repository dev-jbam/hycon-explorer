import { getLogger } from "log4js"
import { EntityRepository, Repository } from "typeorm"
import { BlockEntity } from "../entity/blockEntity"
import { TxEntity } from "../entity/txEntity"
const logger = getLogger("TxRepository")

@EntityRepository(TxEntity)
export class TxRepository extends Repository<TxEntity> {

    public async getTxs(targetAddress: string, pageNumber: number, limit: number) {
        try {
            const txs = await this.createQueryBuilder()
                .select(" * ")
                .where(" `from`=:targetAddress or `to`=:targetAddress", { targetAddress })
                .orderBy(`blockTimeStamp`, "DESC")
                .addOrderBy(`txHash`, "DESC")
                .offset(Number(pageNumber * limit)).limit(limit)
                .execute()

            return txs
        } catch (e) {
            logger.error(`getTxs Failed ${e} `)
        }
    }
    public async getTxsByBlockhash(blockhash: string) {
        try {
            const res = await this.createQueryBuilder()
                .cache(15 * 1000)
                .relation(BlockEntity, "txs")
                .of({ blockhash })
                .loadMany()
            return res
        } catch (e) {
            logger.error(`error getTxsByBlockhash ${e}`)
        }
    }

    public async getTotalTxs() {
        try {
            const totalTxs = await this.createQueryBuilder()
                .where("`from` != 'orphan'")
                .getCount()
            return totalTxs
        } catch (e) {
            logger.error(`renewTopTipHeight failed ${e}`)
        }
        return 0
    }

    public async getDailyTxs() {
        try {
            const targetDay = new Date()
            targetDay.setDate(targetDay.getDate() - 1)
            const totalTxs = await this.createQueryBuilder()
                .where("`from` != 'orphan'")
                .andWhere(`blockTimeStamp > :dayAgo`, { dayAgo: targetDay.getTime() })
                .getCount()
            return totalTxs
        } catch (e) {
            logger.error(`renewTopTipHeight failed ${e}`)
        }
        return 0
    }
}
