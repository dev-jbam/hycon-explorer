import { getLogger } from "log4js"
import { EntityRepository, Repository } from "typeorm"
import { InfoEntity } from "../entity/infoEntity"
const logger = getLogger("InfoRepository")

@EntityRepository(InfoEntity)
export class InfoRepository extends Repository<InfoEntity> {

    public async createAndSave(info: InfoEntity) {
        const infoEntity = new InfoEntity()
        if (info !== undefined) {
            infoEntity.tipHeight = info.tipHeight
            infoEntity.totalTxs = info.totalTxs
            infoEntity.totalAccounts = info.totalAccounts
            infoEntity.dailyTxsCount = info.dailyTxsCount
            infoEntity.monthlyActiveAccounts = info.monthlyActiveAccounts
            infoEntity.totalMinedReward = info.totalMinedReward
        }
        try {
            return await this.manager.save(infoEntity)
        } catch (e) {
            logger.error(`createAndSave faeild ${e}`)
        }
    }

    public async getRecentInfo() {
        try {
            return await this.createQueryBuilder()
                .orderBy(`id`, `DESC`)
                .getOne()
        } catch (e) {
            logger.error(`typeorm updateRecentOne failed : ${e}`)
        }
    }
}
