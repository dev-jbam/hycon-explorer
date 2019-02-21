import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity({ name: "info", engine: "InnoDB" })
export class InfoEntity {

    @PrimaryGeneratedColumn({ type: "int" })
    public id: number

    @Column({ type: "int", nullable: false })
    public tipHeight: number

    @Column({ type: "bigint", nullable: false, default: "0" })
    public totalTxs: string

    @Column({ type: "int", nullable: false, default: "0" })
    public totalAccounts: number

    @Column({ type: "int", nullable: false, default: "0" })
    public dailyTxsCount: number

    @Column({ type: "int", nullable: false, default: "0" })
    public monthlyActiveAccounts: number

    @Column({ type: "bigint", nullable: false, default: "0" })
    public totalMinedReward: string

    @Column({ type: "bigint", nullable: false })
    private _createdAt: number

    @BeforeInsert()
    private createdAt() {
        this._createdAt = Date.now()
    }
}
