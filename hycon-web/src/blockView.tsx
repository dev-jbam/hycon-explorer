import Long = require("long")
import * as React from "react"
import { Link } from "react-router-dom"
import { NotFound } from "./notFound"
import { IBlock, ITx, IUncleInfo, Rest } from "./restv2"
import { hycontoString } from "./stringUtil"
import { TxLine } from "./txLine"
interface IBlockProps {
    rest: Rest
    hash: string
    notFound: boolean
}

interface IBlockViewState {
    rest: Rest
    block?: IBlock
    txs: ITx[]
    uncles: IUncleInfo[]
    hash: string
    totalSent?: string
    totalFee?: string
    length?: number
    volume?: string
    notFound: boolean
    hasMore: boolean
    index: number
}
export class BlockView extends React.Component<IBlockProps, IBlockViewState> {
    public static getDerivedStateFromProps(nextProps: IBlockProps, prevState: IBlockViewState): IBlockViewState {
        return prevState
    }

    constructor(props: IBlockProps) {
        super(props)
        this.state = {
            hasMore: true,
            hash: props.hash,
            index: 1,
            notFound: false,
            rest: props.rest,
            txs: [],
            uncles: [],
        }
        this.getData(props.hash)
    }

    public shouldComponentUpdate(nextProps: Readonly<IBlockProps>, nextState: Readonly<IBlockViewState>, nextContext: any) {
        if (this.state.hash !== nextProps.hash) {
            this.getData(nextProps.hash)
            return false
        }
        if (this.state.block !== nextState.block) {
            return true
        }
        return false
    }

    public componentWillUnmount() {
    }
    public componentDidMount() {
    }
    public render() {
        let uncleIndex = 0
        let txIndex = 0
        if (this.state.notFound) {
            return <NotFound />
        }
        if (!this.state.notFound && this.state.block === undefined) {
            return <div></div>
        }
        const date = new Date(Number(this.state.block.blockTimeStamp))
        return (
            <div>
                <div className="contentTitle">Block #{this.state.block.height}</div>
                <table className="table_margined blockTable">
                    <thead>
                        <tr>
                            <th colSpan={2} className="tableBorder_Header tableHeader_floatLeft">Summary</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Hash</td>
                            <td>{this.state.hash}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Previous Hash</td>
                            <td>
                                <Link to={`/block/${this.state.block.previousHash}`}>
                                    {this.state.block.previousHash}
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Uncles</td>
                            <td> {
                                this.state.block.uncles.length > 0 ? this.state.block.uncles.map((val) => {
                                    return <div key={uncleIndex++}> <Link to={`/uncle/${val.uncleHash}`}>
                                        {val.uncleHash}
                                    </Link> <br /></div>
                                }) : "None"}
                            </td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Merkle Root</td>
                            <td>{this.state.block.merkleRoot}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">State Root</td>
                            <td>{this.state.block.stateRoot}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Difficulty</td>
                            <td>{this.state.block.difficulty}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Nonce</td>
                            <td>{this.state.block.nonce}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Miner</td>
                            <td>
                                <Link to={`/address/${this.state.block.miner}`}>
                                    {this.state.block.miner}
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Mined Time</td>
                            <td>{date.toString()}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Num of Txs</td>
                            <td>{this.state.length}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Tx Volume</td>
                            <td>{hycontoString(Long.fromString(this.state.volume), true)}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Tx Transfer</td>
                            <td>{hycontoString(Long.fromString(this.state.totalSent), true)}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Tx Fees</td>
                            <td>{hycontoString(Long.fromString(this.state.totalFee), true)}</td>
                        </tr>
                    </tbody>
                </table>
                {this.state.txs.map((tx: ITx) => {
                    return (
                        <div key={txIndex++}>
                            <TxLine tx={tx} rest={this.state.rest} />
                            <button className="mdl-button mdl-js-button mdl-button--raised mdl-button--colored txAmtBtn green">
                                {hycontoString(Long.fromString(tx.fee).add(Long.fromString(tx.amount)), true).toString() + " HYCON"}
                            </button>
                        </div>
                    )
                })}
            </div>
        )
    }

    protected async getData(hash: string) {
        try {
            this.state.rest.setLoading(true)
            const data: IBlock = await this.state.rest.getBlock(hash)
            this.state.rest.setLoading(false)
            this.setState({
                block: data,
                hash: data.blockhash,
                length: data.txCount,
                totalFee: data.totalFee,
                totalSent: data.totalSent,
                txs: data.txs ? data.txs : [],
                uncles: data.uncles ? data.uncles : [],
                volume: Long.fromString(data.totalSent).add(Long.fromString(data.totalFee)).toString(),
            })
        } catch (e) {
            console.log(e)
        }
    }
}
