import * as React from "react"
import { Link } from "react-router-dom"
import { getReward, IUncleInfo, Rest } from "./restv2"
import { uncleReward } from "./restv2"
import { hycontoString } from "./stringUtil"
interface IUncleProps {
    rest: Rest
    hash: string

}

interface IUncleViewState {
    rest: Rest
    hash: string
    uncle?: IUncleInfo
}
export class UncleView extends React.Component<IUncleProps, IUncleViewState> {
    public static getDerivedStateFromProps(nextProps: IUncleProps, prevState: IUncleViewState): IUncleViewState {
        return prevState
    }

    constructor(props: IUncleProps) {
        super(props)
        this.state = {
            hash: props.hash,
            rest: props.rest,
        }
        this.getData(props.hash)
    }

    public shouldComponentUpdate(nextProps: Readonly<IUncleProps>, nextState: Readonly<IUncleViewState>, nextContext: any) {
        if (this.state.hash !== nextProps.hash) {
            this.getData(nextProps.hash)
            return false
        }
        if (this.state.uncle !== nextState.uncle) {
            return true
        }
        return false
    }

    public componentWillUnmount() {
    }
    public componentDidMount() {
    }
    public render() {
        if (this.state.uncle === undefined) {
            return <div></div>
        }
        const date = new Date(Number(this.state.uncle.uncleTimeStamp))
        const blockHeight = this.state.uncle.height + this.state.uncle.depth
        return (
            <div>
                <div className="contentTitle">Uncle #{this.state.uncle.height}</div>
                <table className="table_margined blockTable">
                    <thead>
                        <tr>
                            <th colSpan={2} className="tableBorder_Header tableHeader_floatLeft">Summary</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Uncle Height</td>
                            <td>{this.state.uncle.height}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Including Block Height</td>
                            <td> {blockHeight} </td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Difficulty</td>
                            <td>{this.state.uncle.difficulty}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Miner</td>
                            <td>
                                <Link to={`/address/${this.state.uncle.miner}`}>
                                    {this.state.uncle.miner}
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Mined Time</td>
                            <td>{date.toString()}</td>
                        </tr>
                        <tr>
                            <td className="tdSubTitle subTitle_width20">Reward</td>
                            <td>
                                {
                                    hycontoString(uncleReward(getReward(blockHeight), this.state.uncle.depth))
                                } HYCON</td>
                        </tr>
                    </tbody>
                </table>
            </div >
        )
    }

    protected async getData(hash: string) {
        try {
            this.state.rest.setLoading(true)
            const data: IUncleInfo = await this.state.rest.getUncle(hash)
            this.state.rest.setLoading(false)
            this.setState({
                hash,
                uncle: data,
            })
        } catch (e) {
            console.log(e)
        }
    }
}
