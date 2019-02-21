import { Column, Entity, Index, ManyToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { Address } from "../../common/address"
import { BlockEntity } from "./blockEntity"

export interface IUncle {
    miner: Address,
    depth: number,
    hash: string,
    timeStamp: number
    difficulty: string
}

@Entity({ name: "uncle", engine: "InnoDB" })
export class UncleEntity {

    @Index()
    @Column({ type: "int", nullable: false })
    public height: number

    @Column({ type: "int", nullable: false })
    public depth: number

    @PrimaryColumn({ type: "varchar", nullable: false })
    public uncleHash: string

    @Index()
    @Column({ type: "varchar", nullable: false })
    public miner: string

    @Column({ type: "double", nullable: false })
    public difficulty: string

    @Index("uncle_uncletimestamp_idx")
    @Column({ type: "bigint", nullable: false })
    public uncleTimeStamp: number

    @Column({ nullable: false })
    public isUncle: boolean

    @ManyToMany((type) => BlockEntity, (block) => block.uncles)
    public blocks: BlockEntity[]

    constructor(foundBlockHeight?: number, uncle?: IUncle, isUncle?: boolean) {
        if (foundBlockHeight !== undefined && uncle !== undefined && isUncle !== undefined) {
            this.depth = uncle.depth
            this.height = foundBlockHeight - uncle.depth
            this.uncleHash = uncle.hash
            this.isUncle = isUncle
            this.difficulty = uncle.difficulty
            this.uncleTimeStamp = uncle.timeStamp
            this.miner = uncle.miner.toString()
        }
    }
}
