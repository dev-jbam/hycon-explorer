import { BeforeInsert, Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm"

@Entity({ name: "txpool", engine: "InnoDB" })
export class TxPoolEntity {

    @PrimaryGeneratedColumn({ type: "int" })
    public id: number

    @Column({ type: "varchar", nullable: false })
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

    @Column()
    public _createdAt: number

    @BeforeInsert()
    private createdAt() {
        this._createdAt = Date.now()
    }
}
