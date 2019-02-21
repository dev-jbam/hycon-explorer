import { getLogger } from "log4js"
import Long = require("long")
import { EntityRepository, Repository, TreeRepository } from "typeorm"
import { AccountEntity } from "../entity/accountEntity"
const logger = getLogger("Account Repository")

@EntityRepository(AccountEntity)
export class AccountRepository extends Repository<AccountEntity> {

    public async getAccounts(limit: number, index?: number) {
        try {
            index = index === undefined ? 0 : index
            const accountEntities = await this.createQueryBuilder()
                .where(`address != 'burned'`)
                .andWhere(`address != 'minted'`)
                .orderBy("balance", "DESC")
                .offset(Number(index * limit))
                .limit(limit)
                .getMany()

            return accountEntities
        } catch (e) {
            logger.warn(`${e && e.stack} `)
        }
    }
    public async getMonthlyActiveAccounts() {
        try {
            const targetDay = new Date()
            targetDay.setMonth(targetDay.getMonth() - 1)
            const count = await this.createQueryBuilder()
                .where(`updatedAt > :targetTime`, { targetTime: targetDay.getTime() })
                .getCount()
            return count
        } catch (e) {
            logger.error(`getNumberofActiveAccounts failed ${e}`)
        }
        return 0
    }

    public async getTotalAccounts() {
        try {
            const totalAccounts = await this.createQueryBuilder()
                .where("`address` != 'minted'")
                .andWhere("`address` != 'burned'")
                .getCount()
            return totalAccounts
        } catch (e) {
            logger.error(`renewTopTipHeight failed ${e}`)
        }
        return 0
    }

    public async getSumBalance(addresses: string[]) {
        try {
            const entities = await this.findByIds(addresses)
            let balance = Long.UZERO
            for (const entity of entities) {
                balance = balance.add(Long.fromString(entity.balance, true))
            }
            return balance
        } catch (e) {
            logger.error(`getBalance is failed`)
        }
    }

    public async saveAccounts(accounts: AccountEntity[], blocktime: number) {
        for (const account of accounts) {
            account.setUpdatedAt(blocktime)
        }
        await this.save(accounts)
    }

}
