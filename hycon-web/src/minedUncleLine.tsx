import Long = require("long")
import * as React from "react"
import { Link } from "react-router-dom"
import { getReward, IUncleInfo } from "./restv2"
import { uncleReward } from "./restv2"
import { hycontoString } from "./stringUtil"

interface IMinedUncleLineProps {
    uncleInfo: IUncleInfo
}
interface IMinedUncleLineView {
    uncleInfo: IUncleInfo
}
export class MinedUncleLine extends React.Component<IMinedUncleLineProps, IMinedUncleLineView> {
    public mounted: boolean = false
    constructor(props: IMinedUncleLineProps) {
        super(props)
        this.state = { uncleInfo: props.uncleInfo }
    }
    public componentWillUnmount() {
        this.mounted = false
    }

    public render() {
        const date = new Date(Number(this.state.uncleInfo.uncleTimeStamp))
        if (this.state.uncleInfo === undefined) {
            return < div ></div >
        }
        const findBlockHeight = this.state.uncleInfo.height + this.state.uncleInfo.depth
        return (
            <tr>
                <td className="mdl-data-table__cell--numeric" style={{ textAlign: "center" }}>
                    {this.state.uncleInfo.height}
                </td>

                <td className="mdl-data-table__cell--numeric" style={{ textAlign: "center" }}>
                    {this.state.uncleInfo.height + this.state.uncleInfo.depth}
                </td>
                <td className="mdl-data-table__cell--non-numeric">
                    <Link to={`/uncle/${this.state.uncleInfo.uncleHash}`}>
                        {this.state.uncleInfo.uncleHash}
                    </Link>
                </td>
                <td className="mdl-data-table__cell--numeric" style={{ textAlign: "center" }}>
                    {this.state.uncleInfo.miner}
                </td>

                <td className="mdl-data-table__cell--numeric" style={{ paddingRight: "10%" }}>
                    {hycontoString(uncleReward(getReward(findBlockHeight), this.state.uncleInfo.depth))} HYCON
                </td>
                <td className="mdl-data-table__cell--non-numeric">
                    {date.toString()}
                </td>
            </tr >
        )
    }
}
