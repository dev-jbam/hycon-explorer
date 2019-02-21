import Long = require("long")
import * as React from "react"
import { Link } from "react-router-dom"
import { IAccount, ITx, Rest } from "./restv2"
import { hycontoString } from "./stringUtil"
interface ITxLineProps {
    rest: Rest
    tx: ITx
    address?: IAccount
}
interface ITxLineView {
    rest: Rest
    tx: ITx
    address?: IAccount
}
export class TxLine extends React.Component<ITxLineProps, ITxLineView> {
    constructor(props: ITxLineProps) {
        super(props)
        this.state = { tx: props.tx, rest: props.rest, address: props.address ? props.address : undefined }
    }
    public componentWillReceiveProps(newProps: ITxLineProps) {
        this.setState(newProps)
    }
    public render() {
        const amountString = hycontoString(Long.fromString(this.state.tx.amount), true)
        const feeString = hycontoString(Long.fromString(this.state.tx.fee), true)
        const date = new Date(Number(this.state.tx.blockTimeStamp))
        return (
            <table className="table_margined">
                <thead>
                    <tr>
                        <th colSpan={4} className="tableBorder_Header">
                            {Number(this.state.tx.blockTimeStamp) ? (
                                <div>
                                    <Link to={`/tx/${this.state.tx.txHash}`}>
                                        <span className="coloredText">{this.state.tx.txHash}</span>
                                    </Link>
                                    <span className="timeStampArea">
                                        {date.toString()}
                                    </span>

                                </div>
                            ) : (
                                    <div>
                                        <span>{this.state.tx.txHash}</span>
                                        <span className="timeStampArea textRed"> Pending </span>
                                    </div>
                                )}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="coloredText tableDivision txAddrTd">
                            {this.state.tx.from ? (
                                <Link to={`/address/${this.state.tx.from}`}>
                                    {this.state.tx.from}
                                </Link>
                            ) : (
                                    <span className="NoFrom">No Inputs(Newly Generated Coins)</span>
                                )}
                        </td>
                        <td>
                            <i className="material-icons">forward</i>
                        </td>
                        <td className="coloredText tableDivision txAddrTd">
                            {this.state.tx.to ? (
                                <Link to={`/address/${this.state.tx.to}`}>
                                    {this.state.tx.to}
                                </Link>
                            ) : (
                                    <span className="CantDecode">
                                        Unable to decode output address
                </span>
                                )}
                        </td>
                        <td className="tableDivision amountTd">
                            {amountString + " HYCON"}<br />
                            {this.state.tx.fee ? (<span className="fee-font">Fee : {feeString} HYCON</span>) : ""}
                        </td>
                    </tr>
                </tbody>
            </table>
        )
    }
}
