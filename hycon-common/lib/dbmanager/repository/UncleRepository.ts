import { getLogger } from "log4js"
import { EntityRepository, Repository } from "typeorm"
import { BlockEntity } from "../entity/blockEntity"
import { UncleEntity } from "../entity/uncleEntity"
const logger = getLogger("UncleRepository")

@EntityRepository(UncleEntity)
export class UncleRepository extends Repository<UncleEntity> {
    public async getMinedUncles(targetMiner: string, limit: number, pageNumber?: number) {
        try {
            pageNumber = pageNumber === undefined ? 0 : pageNumber
            const uncles = await this.createQueryBuilder()
                .select(`height, depth, uncleHash, miner, difficulty, uncleTimeStamp`)
                .where(` miner=:targetMiner and isUncle=true`, { targetMiner })
                .orderBy(`height`, "DESC")
                .offset(Number(pageNumber * limit)).limit(limit)
                .execute()

            return uncles
        } catch (e) {
            logger.warn("getMinedUncles Failed ", e)
        }
    }

    public async getUncles(targetHeight: number) {
        try {
            const uncles: UncleEntity[] = await this.createQueryBuilder()
                .where(`isUncle=true`)
                .andWhere(`height > :targetHeight`, { targetHeight })
                .getMany()
            return uncles
        } catch (e) {
            logger.error(`getTotalUncleReward failed ${e}`)
        }
    }

    public async getUnclesByBlockhash(blockhash: string) {
        try {
            const uncles = await this.createQueryBuilder()
                .relation(BlockEntity, "uncles")
                .of({ blockhash })
                .loadMany()
            return uncles
        } catch (e) {
            logger.warn("getUncleByBlockhash failed %s", blockhash, e)
        }
    }

}
