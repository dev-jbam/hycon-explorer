import Long = require("long")
import * as React from "react"
import { Link } from "react-router-dom"
import { getReward, IMinedInfo } from "./restv2"
import { hycontoString } from "./stringUtil"

interface IMinedBlockLineProps {
    minedInfo: IMinedInfo
}
interface IMinedBlockLineView {
    minedInfo: IMinedInfo
}
export class MinedBlockLine extends React.Component<IMinedBlockLineProps, IMinedBlockLineView> {
    public mounted: boolean = false
    constructor(props: IMinedBlockLineProps) {
        super(props)
        this.state = { minedInfo: props.minedInfo }
    }
    public componentWillUnmount() {
        this.mounted = false
    }

    public render() {
        const date = new Date(Number(this.state.minedInfo.blockTimeStamp))
        if (this.state.minedInfo === undefined) {
            return < div ></div >
        }
        return (
            <tr>
                <td className="mdl-data-table__cell--numeric" style={{ textAlign: "center" }}>
                    {this.state.minedInfo.height}
                </td>

                <td className="mdl-data-table__cell--non-numeric">
                    <Link to={`/block/${this.state.minedInfo.blockhash}`}>
                        {this.state.minedInfo.blockhash}
                    </Link>
                </td>
                <td className="mdl-data-table__cell--numeric" style={{ paddingRight: "10%" }}>
                    {hycontoString(Long.fromString(this.state.minedInfo.feeReward, true).add(getReward(this.state.minedInfo.height)), true)} HYCON
                </td>
                <td className="mdl-data-table__cell--non-numeric">
                    {date.toString()}
                </td>

            </tr >
        )
    }
}
