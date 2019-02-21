import Long = require("long")
import { Column, Entity, Index, JoinTable, ManyToMany, PrimaryColumn } from "typeorm"
import { Block } from "../../common/block"
import { GenesisBlock } from "../../common/blockGenesis"
import { SignedTx } from "../../common/txSigned"
import { Hash } from "../../util/hash"
import { TxEntity } from "./txEntity"
import { IUncle, UncleEntity } from "./uncleEntity"

@Entity({ name: "block", engine: "InnoDB" })
export class BlockEntity {
    @Index()
    @Column({ type: "int", nullable: false })
    public height: number

    @Column({ type: "varchar", nullable: false })
    public previousHash: string

    @PrimaryColumn({ type: "varchar", nullable: false })
    public blockhash: string

    @Column({ nullable: false, default: 0 })
    public txCount: number

    @Column({ type: "double", nullable: false })
    public difficulty: string

    @Column({ type: "varchar", nullable: false })
    public merkleRoot: string

    @Column({ type: "varchar", nullable: false })
    public stateRoot: string

    @Column({ type: "varchar", nullable: false })
    public nonce: string

    @Index("block_blocktimestamp_idx")
    @Column({ type: "bigint", nullable: false })
    public blockTimeStamp: number

    @Index()
    @Column({ type: "varchar", nullable: false })
    public miner: string

    @Column({ nullable: false })
    public isMain: boolean

    @Column({ type: "double", nullable: false })
    public totalWork: number

    @Column({ type: "bigint", nullable: false, default: 0 })
    public totalFee: string

    @Column({ type: "bigint", nullable: true, default: 0 })
    public totalSent: string

    @Column({ nullable: false, default: 0 })
    public uncleCount: number

    @Column({ type: "bigint", default: 0 })
    public totalSupply: string

    @ManyToMany((type) => TxEntity, (tx) => tx.blocks)
    @JoinTable()
    public txs: TxEntity[]

    @ManyToMany((type) => UncleEntity, (uncle) => uncle.blocks)
    @JoinTable()
    public uncles: UncleEntity[]

    constructor(block?: Block, height?: number, isMain?: boolean, totalWork?: number, uncles?: IUncle[]) {
        if (block !== undefined && height !== undefined && isMain !== undefined && totalWork !== undefined && uncles !== undefined) {
            this.blockToEntityMapper(block, height, isMain, totalWork)
            this.unclesParsing(uncles, isMain)
        }
    }

    public genesisToEntityMapper(genesis: GenesisBlock, height: number, isMain: boolean) {
        // @ts-ignore
        this.commonValueMapper(genesis as Block, height, true)

        this.totalWork = 0
        this.nonce = ""
        this.miner = ""
        this.previousHash = ""
        // @ts-ignore
        this.txsParsingAndPush(genesis as Block)
    }

    public blockToEntityMapper(block: Block, height: number, isMain: boolean, totalWork: number) {
        this.commonValueMapper(block, height, isMain)

        this.totalWork = totalWork
        this.nonce = block.header.nonce.toString()
        this.miner = block.header.miner.toString()
        this.previousHash = block.header.previousHash[0].toString()

        this.txsParsingAndPush(block)
    }

    private commonValueMapper(block: Block, height: number, isMain: boolean) {
        this.height = height
        this.blockhash = new Hash(block.header).toString()
        this.txCount = block.txs.length
        this.difficulty = block.header.difficulty.toString()
        this.merkleRoot = block.header.merkleRoot.toString()
        this.stateRoot = block.header.stateRoot.toString()
        this.blockTimeStamp = block.header.timeStamp
        this.isMain = isMain
    }

    private txsParsingAndPush(block: Block) {
        this.txs = []
        let totalFees = Long.UZERO
        let totalSentAmount = Long.UZERO
        for (const tx of block.txs) {
            if (tx.fee !== undefined) { totalFees = totalFees.add(tx.fee) }
            totalSentAmount = totalSentAmount.add(tx.amount)
            this.txs.push(new TxEntity(tx as SignedTx, this.blockhash, this.blockTimeStamp))
        }
        this.totalFee = totalFees.toString()
        this.totalSent = totalSentAmount.toString()
    }

    private unclesParsing(uncles: IUncle[], isMain: boolean) {
        this.uncles = []
        for (const uncle of uncles) {
            this.uncles.push(new UncleEntity(this.height, uncle, isMain))
        }
        this.uncleCount = uncles.length
    }
}
