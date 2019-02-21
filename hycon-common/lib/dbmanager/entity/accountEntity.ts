import Long = require("long")
import { Column, Entity, Index, PrimaryColumn } from "typeorm"

@Entity({ name: "account", engine: "InnoDB" })
export class AccountEntity {

    @PrimaryColumn({ type: "varchar", nullable: false })
    public address: string

    @Index("balance_account_idx")
    @Column({ type: "bigint", nullable: false, default: "0" })
    public balance: string

    @Column({ nullable: false, default: 0 })
    public nonce: number

    @Column({ type: "bigint", default: 0 })
    private updatedAt: number

    constructor(address?: string, balance?: string, nonce?: number) {
        if (address !== undefined) {
            this.address = address
        }
        if (balance !== undefined) {
            this.balance = balance
        }
        if (nonce !== undefined) {
            this.nonce = nonce
        }
    }

    public addBalance(amount: Long | number, fee: Long | number = 0) {
        const balance = Long.fromString(this.balance)
        this.balance = balance.add(amount).add(fee).toString()
    }

    public substractBalance(amount: Long | number, fee: Long | number = 0) {
        const balance = Long.fromString(this.balance)
        this.balance = balance.sub(amount).sub(fee).toString()
    }
    public setUpdatedAt(blockTimeStamp: number) {
        this.updatedAt = blockTimeStamp
    }
}
