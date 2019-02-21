import Long = require("long")
import * as React from "react"
import { Link } from "react-router-dom"
import { NotFound } from "./notFound"
import { ITx, Rest } from "./restv2"
import { hycontoString } from "./stringUtil"
import { TxLine } from "./txLine"

interface ITxViewProps {
    rest: Rest
    hash: string
}
interface ITxViewState {
    rest: Rest
    hash: string
    tx?: ITx
    notFound: boolean
}

export class TxView extends React.Component<ITxViewProps, ITxViewState> {
    public static getDerivedStateFromProps(nextProps: ITxViewProps, prevState: ITxViewState): ITxViewState {
        return prevState
    }
    constructor(props: ITxViewProps) {
        super(props)
        this.state = {
            hash: props.hash,
            notFound: false,
            rest: props.rest,
        }
        this.getData(props.hash)
    }

    public shouldComponentUpdate(nextProps: Readonly<ITxViewProps>, nextState: Readonly<ITxViewState>, nextContext: any) {
        if (this.state.hash !== nextProps.hash) {
            this.getData(nextState.hash)
            return false
        }
        if (this.state.tx !== nextState.tx) {
            return true
        }
        return false
    }

    public componentWillUnMount() {
    }
    public componentDidMount() {
    }
    public render() {
        if (this.state.notFound) {
            return <NotFound />
        }
        if (!this.state.notFound && this.state.tx === undefined) {
            return < div ></div >
        }
        const date = new Date(Number(this.state.tx.blockTimeStamp))
        const feeString = hycontoString(Long.fromString(this.state.tx.fee), true)
        const sumString = hycontoString(Long.fromString(this.state.tx.amount).add(Long.fromString(this.state.tx.fee)), true)
        return (
            <div>
                <div className="contentTitle">Transaction</div>
                <div>
                    <TxLine rest={this.state.rest} tx={this.state.tx} />
                    <button className="mdl-button mdl-js-button mdl-button--raised mdl-button--colored txAmtBtn green">
                        {sumString + " HYCON"}
                    </button>
                    <button className="mdl-button mdl-js-button mdl-button--raised mdl-button--colored txAmtBtn">
                        {this.state.tx.confirmations} Confirmations
                    </button>
                </div>
                <div className="mdl-grid">
                    <table className="mdl-cell mdl-data-table mdl-js-data-table mdl-shadow--2dp table_margined tablesInRow txSummaryTable">
                        <thead>
                            <tr>
                                <th
                                    colSpan={2}
                                    className="mdl-data-table__cell--non-numeric tableHeader_floatLeft"
                                >
                                    Summary
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="mdl-data-table__cell--non-numeric">
                                    Received Time
                                </td>
                                <td className="numericTd">{date.toString()}</td>
                            </tr>
                            <tr>
                                <td className="mdl-data-table__cell--non-numeric">
                                    Included In Blocks
                                </td>
                                <td className="numericTd">
                                    <Link to={`/block/${this.state.tx.blockhash}`}>{this.state.tx.blockhash}</Link>
                                </td>
                            </tr>
                            <tr>
                                <td className="mdl-data-table__cell--non-numeric">Fees</td>
                                <td className="numericTd">{feeString} HYCON</td>
                            </tr>
                            <tr>
                                <td className="mdl-data-table__cell--non-numeric">Nonce</td>
                                <td className="numericTd">{this.state.tx.nonce}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
    protected async getData(hash: string) {
        try {
            this.state.rest.setLoading(true)
            const data = await this.state.rest.getTx(hash)
            this.state.rest.setLoading(false)
            if (data.txHash === undefined) {
                this.setState({
                    hash,
                    notFound: true,
                })
            } else {
                this.setState({
                    hash,
                    tx: data,
                })
            }
        } catch (e) {
            console.log(e)
        }
    }
}
