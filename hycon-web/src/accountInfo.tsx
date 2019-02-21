import Long = require("long")
import { Tab, Tabs } from "material-ui/Tabs"
import * as QRCode from "qrcode.react"
import * as React from "react"
import update = require("react-addons-update")
import { Redirect } from "react-router-dom"
import { MinedBlockLine } from "./minedBlockLine"
import { MinedUncleLine } from "./minedUncleLine"
import { IAccount, IMinedInfo, ITx, IUncleInfo, Rest } from "./restv2"
import { hycontoString } from "./stringUtil"
import { TxLine } from "./txLine"
interface IAccountProps {
    rest: Rest
    hash: string
}
interface IAccountView {
    rest: Rest
    redirectTxView: boolean
    address: string
    txs: ITx[],
    hasMore: boolean,
    hasMoreMinedInfo: boolean,
    hasMoreUncleInfo: boolean,
    txsPageNumber: number,
    minedBlocks: IMinedInfo[],
    minedUncles: IUncleInfo[],
    minedBlockIndex: number,
    minedUncleIndex: number,
    account?: IAccount
}
export class AccountInfo extends React.Component<IAccountProps, IAccountView> {
    public static getDerivedStateFromProps(nextProps: IAccountProps, prevState: IAccountView): IAccountView {
        return prevState
    }
    constructor(props: IAccountProps) {
        super(props)
        this.state = {
            address: props.hash,
            hasMore: true,
            hasMoreMinedInfo: true,
            hasMoreUncleInfo: true,
            minedBlockIndex: 1,
            minedBlocks: [],
            minedUncleIndex: 1,
            minedUncles: [],
            redirectTxView: false,
            rest: props.rest,
            txs: [],
            txsPageNumber: 1,
        }
        this.getData(props.hash)
    }

    public shouldComponentUpdate(nextProps: Readonly<IAccountProps>, nextState: Readonly<IAccountView>, nextContext: any) {
        if (this.state.address !== nextProps.hash) {
            this.getData(nextProps.hash)
            return false
        }
        if (this.state.account !== nextState.account) {
            return true
        }

        if (this.state.txs !== nextState.txs) {
            return true
        }

        if (this.state.minedBlocks !== nextState.minedBlocks) {
            return true
        }

        if (this.state.minedUncles !== nextState.minedUncles) {
            return true
        }
        return false
    }

    public componentWillUnmount() {
    }
    public componentDidMount() {

    }
    public render() {
        if (this.state.account === undefined) {
            return < div ></div >
        }
        let count = 0
        let minedIndex = 0
        let uncleIndex = 0
        const finalBalanceString = hycontoString(Long.fromString(this.state.account.balance), true)
        return (
            <div>
                <div className="sumTablesDiv">
                    <table className="tablesInRow twoTablesInRow">
                        <thead>
                            <tr>
                                <th colSpan={2} className="tableBorder_Header tableHeader_floatLeft">Summary</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="tdSubTitle subTitle_width20">Address</td>
                                <td>{this.state.address}</td>
                            </tr>
                            <tr>
                                <td className="tdSubTitle subTitle_width40">Final balance</td>
                                <td>{finalBalanceString}</td>
                            </tr>
                        </tbody>
                    </table>
                    <span className="QRSpan">
                        <QRCode size={170} value={this.state.address} />
                    </span>
                </div>
                <Tabs style={{ paddingTop: "2px" }} inkBarStyle={{ backgroundColor: "#000" }}>
                    <Tab label="Transaction" style={{ backgroundColor: "#FFF", color: "#000" }}>
                        {this.state.txs.map((tx: ITx) => {
                            const amountString = hycontoString(Long.fromString(tx.amount), true)
                            return (
                                <div key={count++}>
                                    <TxLine tx={tx} rest={this.state.rest} address={this.state.account} />
                                    <div>
                                        {tx.from === this.state.address ? (
                                            <button className="mdl-button mdl-js-button mdl-button--raised mdl-button--accent txAmtBtn">
                                                -{amountString} HYCON
                                            </button>
                                        ) : (
                                                <button className="mdl-button mdl-js-button mdl-button--raised mdl-button--colored txAmtBtn">
                                                    {amountString} HYCON
                                            </button>
                                            )}
                                    </div>
                                </div>
                            )
                        })}
                        {this.state.hasMore && this.state.txs.length > 0 ?
                            (<div><button className="btn btn-block btn-info" onClick={() => this.fetchNextTxs()}>Load more</button></div>)
                            :
                            (<div></div>)}
                    </Tab>
                    <Tab label="Mine Reward" style={{ backgroundColor: "#FFF", color: "#000" }}>
                        <table className="mdl-data-table mdl-js-data-table mdl-shadow--2dp table_margined">
                            <thead>
                                <tr>
                                    <th className="mdl-data-table__cell--non-numeric">Block Height</th>
                                    <th className="mdl-data-table__cell--non-numeric">Mined Blockhash</th>
                                    <th className="mdl-data-table__cell--numeric" style={{ paddingRight: "10%" }}>Reward + Fee</th>
                                    <th className="mdl-data-table__cell--non-numeric">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.minedBlocks.map((minedInfo: IMinedInfo) => {
                                    return <MinedBlockLine key={minedIndex++} minedInfo={minedInfo} />
                                })}
                            </tbody>
                        </table>
                        <br />
                        {this.state.hasMoreMinedInfo && this.state.minedBlocks.length > 0 ?
                            (<div><button className="btn btn-block btn-info" onClick={() => this.fetchNextMinedInfo()}>Load more</button></div>)
                            :
                            (<div></div>)}
                    </Tab>
                    <Tab label="Uncle Reward" style={{ backgroundColor: "#FFF", color: "#000" }}>
                        <table className="mdl-data-table mdl-js-data-table mdl-shadow--2dp table_margined">
                            <thead>
                                <tr>
                                    <th className="mdl-data-table__cell--non-numeric">Uncle Height</th>
                                    <th className="mdl-data-table__cell--non-numeric">Block Height</th>
                                    <th className="mdl-data-table__cell--non-numeric">Uncle Hash</th>
                                    <th className="mdl-data-table__cell--non-numeric" style={{ paddingLeft: "10%" }}>Miner</th>
                                    <th className="mdl-data-table__cell--numeric" style={{ paddingRight: "10%" }}>Uncle Reward</th>
                                    <th className="mdl-data-table__cell--non-numeric">Times</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.minedUncles.map((uncleInfo: IUncleInfo) => {
                                    return <MinedUncleLine key={uncleIndex++} uncleInfo={uncleInfo} />
                                })}
                            </tbody>
                        </table>
                        <br />
                        {this.state.hasMoreUncleInfo && this.state.minedUncles.length > 0 ?
                            (<div><button className="btn btn-block btn-info" onClick={() => this.fetchNextUncleInfo()}>Load more</button></div>)
                            :
                            (<div></div>)}
                    </Tab>
                </Tabs>
            </div>
        )
    }

    protected async getData(address: string) {
        try {
            this.state.rest.setLoading(true)
            const data = await this.state.rest.getAccountInfo(address)
            this.state.rest.setLoading(false)
            this.setState({
                account: data,
                address: data.address,
                minedBlocks: data !== undefined ? data.minedBlocks : undefined,
                minedUncles: data !== undefined ? data.minedUncles : undefined,
                txs: data.txs,
            })
        } catch (e) {
            console.log(e)
        }
    }
    private async fetchNextTxs() {
        try {
            this.state.rest.setLoading(true)
            const result = await this.state.rest.getNextTxs(this.state.address, this.state.txsPageNumber)
            this.state.rest.setLoading(false)
            if (result.length === 0) { this.setState({ hasMore: false }) }
            this.setState({
                txs: update(this.state.txs, { $push: result }),
                txsPageNumber: this.state.txsPageNumber + 1,
            })
        } catch (e) {
            console.log(e)
        }

    }

    private async fetchNextMinedInfo() {
        try {
            this.state.rest.setLoading(true)
            const result = await this.state.rest.getMinedBlocks(this.state.address, this.state.minedBlocks[this.state.minedBlocks.length - 1].height, this.state.minedBlockIndex)
            this.state.rest.setLoading(false)
            if (result.length === 0) { this.setState({ hasMoreMinedInfo: false }) }
            this.setState({
                minedBlockIndex: this.state.minedBlockIndex + 1,
                minedBlocks: update(this.state.minedBlocks, { $push: result }),
            })
        } catch (e) {
            console.log(e)
        }
    }

    private async fetchNextUncleInfo() {
        try {
            this.state.rest.setLoading(true)
            const result = await this.state.rest.getMinedUncles(this.state.address, this.state.minedUncles[this.state.minedUncles.length - 1].height, this.state.minedUncleIndex)
            this.state.rest.setLoading(false)
            if (result.length === 0) { this.setState({ hasMoreUncleInfo: false }) }
            this.setState({
                minedUncleIndex: this.state.minedUncleIndex + 1,
                minedUncles: update(this.state.minedUncles, { $push: result }),
            })
        } catch (e) {
            console.log(e)
        }
    }
}
