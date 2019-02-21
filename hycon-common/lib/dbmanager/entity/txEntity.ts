import Long = require("long")
import { Column, Entity, Index, ManyToMany, PrimaryColumn } from "typeorm"
import { SignedTx } from "../../common/txSigned"
import { Hash } from "../../util/hash"
import { AccountEntity } from "./accountEntity"
import { BlockEntity } from "./blockEntity"
export interface ITransactionDTO {
    txhash: string
    from: string
    to: string
    amount: string
    fee: string
    blockhash: string
    blockTimeStamp: number
}
@Entity({ name: "tx", engine: "InnoDB" })
export class TxEntity {

    @PrimaryColumn({ type: "varchar", nullable: false })
    public txHash: string

    @Index("tx_from_idx")
    @Column({ type: "varchar", nullable: false })
    public from: string
    @Index("tx_to_idx")
    @Column({ type: "varchar", nullable: false, default: "" })
    public to: string

    @Column({ type: "bigint", nullable: false, unsigned: true })
    public amount: string

    @Column({ type: "bigint", nullable: false, unsigned: true })
    public fee: string

    @Column({ nullable: false, default: 0 })
    public nonce: number

    @Column({ nullable: false })
    public signature: string

    @ManyToMany((type) => BlockEntity, (block) => block.txs)
    public blocks: BlockEntity[]

    @Column({ nullable: true })
    @Index("tx_blockhash_idx")
    public blockhash: string

    @Column({ type: "bigint", nullable: true })
    @Index("tx_blocktimestamp_idx")
    public blockTimeStamp: number

    constructor(txs?: SignedTx, blockhash?: string, blockTimeStamp?: number) {
        if (txs !== undefined) {
            this.signedTxToEntityMapper(txs)
        }
        if (blockTimeStamp !== undefined && blockhash !== undefined) {
            this.blockTimeStamp = blockTimeStamp
            this.blockhash = blockhash
        }
    }
    public getTransactionDTO(): ITransactionDTO {
        const dto: ITransactionDTO = {
            txhash: this.txHash,
            // tslint:disable-next-line:object-literal-sort-keys
            from: this.from,
            to: this.to,
            amount: this.amount,
            fee: this.fee,
            blockhash: this.blockhash,
            blockTimeStamp: this.blockTimeStamp,
        }
        return dto
    }

    public signedTxToEntityMapper(signedTx: SignedTx) {
        this.txHash = new Hash(signedTx).toString()
        this.from = signedTx.from === undefined ? "minted" : signedTx.from.toString()
        this.to = signedTx.to === undefined ? "burned" : signedTx.to.toString()
        this.amount = signedTx.amount.toString()
        this.fee = signedTx.fee === undefined ? "0" : signedTx.fee.toString()
        this.nonce = signedTx.nonce
        this.signature = signedTx.signature.toString("hex")
    }

    public process(accountEntityMap: Map<string, AccountEntity>) {
        const fromAccount = accountEntityMap.get(this.from)
        const toAccount = accountEntityMap.get(this.to)
        const amount = Long.fromString(this.amount)
        const fee = Long.fromString(this.fee)

        fromAccount.substractBalance(amount, fee)
        fromAccount.nonce++
        toAccount.addBalance(amount)
    }
    public reverse(accountEntityMap: Map<string, AccountEntity>) {
        const fromAccount = accountEntityMap.get(this.from)
        const toAccount = accountEntityMap.get(this.to)
        const amount = Long.fromString(this.amount)
        const fee = Long.fromString(this.fee)

        fromAccount.addBalance(amount, fee)
        fromAccount.nonce--
        toAccount.substractBalance(amount)
    }
}
