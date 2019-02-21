import { Icon, IconButton, InputAdornment, TextField } from "@material-ui/core"
import Long = require("long")
import * as React from "react"
import update = require("react-addons-update")
import ReactPaginate from "react-paginate"
import { Redirect } from "react-router-dom"
import { AccountLine } from "./accountLine"
import { IAccount, Rest } from "./restv2"
import { hyconfromString, hycontoString } from "./stringUtil"

interface IAccountListView {
    rest: Rest
    accounts: IAccount[]
}

interface IProps {
    rest: Rest
}

interface IState {
    accountAddress: string
    accounts: IAccount[]
    index: number
    length: number
    redirect: boolean
    rest: Rest
    searchWord: string
}
export class AccountList extends React.Component<IProps, IState> {
    public intervalId: any // NodeJS.Timer

    public mounted: boolean = false
    constructor(props: any) {
        super(props)
        this.state = {
            accountAddress: "",
            accounts: [],
            index: 0,
            length: 0,
            redirect: false,
            rest: props.rest,
            searchWord: undefined,
        }
    }
    public componentWillUnmount() {
        this.mounted = false

    }

    public componentDidMount() {
        this.mounted = true
        this.getRecentAccountList(this.state.index)
    }

    public getRecentAccountList(index: number) {
        this.state.rest.setLoading(true)
        this.state.rest.getAccountList(index).then((result: { accounts: IAccount[], length: number }) => {

            this.setState({
                accounts: update(
                    this.state.accounts, {
                        $splice: [[0, this.state.accounts.length]],
                    },
                ),
            })
            this.setState({
                accounts: update(
                    this.state.accounts, {
                        $push: result.accounts,
                    },
                ),
                index: update(
                    this.state.index, {
                        $set: index,
                    },
                ),
                length: update(
                    this.state.length, {
                        $set: result.length,
                    },
                ),
            })
        })

        this.state.rest.setLoading(false)
    }

    public render() {
        let accountIndex = 0
        if (this.state.accounts.length === 0) {
            return < div ></div >
        }
        if (this.state.redirect) {
            return <Redirect to={`/address/${this.state.accountAddress}`} />
        }
        return (
            <div>
                <div className="contentTitle">Accounts</div>
                <TextField label="Search" placeholder="Account Address"
                    onChange={(data) => this.handleAccountAddress(data)}
                    onKeyPress={(event) => { if (event.key === "Enter") { this.searchAccount(event) } }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={(event) => { this.searchAccount(event) }}><Icon>search</Icon></IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                <div>
                    <span className="seeMoreLink">
                        <ReactPaginate previousLabel={"PREV"}
                            nextLabel={"NEXT"}
                            breakLabel={<a>...</a>}
                            breakClassName={"break-me"}
                            pageCount={this.state.length}
                            marginPagesDisplayed={1}
                            pageRangeDisplayed={9}
                            onPageChange={this.handlePageClick}
                            containerClassName={"pagination"}
                            activeClassName={"active"}
                            initialPage={this.state.index}
                            disableInitialCallback={true}
                        />
                    </span>
                </div>
                <div>
                    <table className="mdl-data-table mdl-js-data-table mdl-shadow--2dp table_margined">
                        <thead>
                            <tr>
                                <th className="mdl-data-table__cell--non-numeric" style={{ textAlign: "center" }}>Address</th>
                                <th className="mdl-data-table__cell--numeric" style={{ paddingRight: "10%" }}>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.accounts.map((account: IAccount) => {
                                return <AccountLine key={accountIndex++} rest={this.state.rest} account={account} />
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    private handlePageClick = (data: any) => {
        this.getRecentAccountList(data.selected)
    }
    private handleAccountAddress(data: any) {
        this.setState({ accountAddress: data.target.value })
    }
    private searchAccount(event: any) {
        if (this.state.accountAddress === undefined) {
            event.preventDefault()
        } else if (!/^[a-zA-Z0-9]+$/.test(this.state.accountAddress)) {
            event.preventDefault()
            alert(`Please enter a valid Account hash consisting of numbers and English`)
        } else {
            this.setState({ redirect: true })
        }
    }
}
