import Long = require("long")
import * as React from "react"
import { Link } from "react-router-dom"
import { IAccount, ITx, Rest } from "./restv2"
import { hycontoString } from "./stringUtil"
interface IAccountProps {
    rest: Rest
    account: IAccount
}
interface IAccountLineView {
    rest: Rest
    account: IAccount
}
export class AccountLine extends React.Component<IAccountProps, IAccountLineView> {
    constructor(props: IAccountProps) {
        super(props)
        this.state = { rest: props.rest, account: props.account }
    }
    public render() {
        const amountString = hycontoString(Long.fromString(this.state.account.balance), true)
        if (this.state.account === undefined) {
            return < div ></div >
        }
        return (
            <tr>
                <td className="mdl-data-table__cell--numeric" style={{ textAlign: "center" }} >
                    <Link to={`/address/${this.state.account.address}`}>
                        {this.state.account.address}
                    </Link>
                </td>
                <td className="mdl-data-table__cell--numeric" style={{ paddingRight: "10%" }}>
                    {hycontoString(Long.fromString(this.state.account.balance), true)} HYCON
                </td>
            </tr >
        )
    }
}
