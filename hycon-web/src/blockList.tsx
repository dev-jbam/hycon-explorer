import { Card, CardContent, Grid, Icon, IconButton, InputAdornment, Select, TextField } from "@material-ui/core"
import Long = require("long")
import * as React from "react"
import update = require("react-addons-update")
import ReactPaginate from "react-paginate"
import { Redirect } from "react-router-dom"
import { BlockLine } from "./blockLine"
import { IBlock, IResponseError, Rest } from "./restv2"

interface IBlockListView {
    rest: Rest
    blocks: IBlock[]
}

interface IState {
    blocks: IBlock[]
    index: number
    pageCount: number
    redirect: boolean
    rest: Rest
    searchWord: string
    selectedOption: string
}

export class BlockList extends React.Component<any, IState> {
    public intervalId: any // NodeJS.Timer
    public mounted: boolean = false
    constructor(props: any) {
        super(props)
        this.state = {
            blocks: [],
            index: 0,
            pageCount: 0,
            redirect: false,
            rest: props.rest,
            searchWord: undefined,
            selectedOption: "block",
        }
    }
    public componentWillUnmount() {
        this.mounted = false
        window.clearTimeout(this.intervalId)
    }

    public componentDidMount() {
        this.getRecentBlockList(this.state.index)
        this.intervalId = setInterval(() => {
            this.getRecentBlockList(this.state.index)
        }, 30 * 1000)
    }

    public async getRecentBlockList(index: number) {
        try {
            const result = await this.state.rest.getBlockList(index)
            this.setState({
                blocks: update(
                    this.state.blocks, {
                        $splice: [[0, this.state.blocks.length]],
                    },
                ),
            })
            this.setState({
                blocks: update(
                    this.state.blocks, {
                        $push: result.blocks,
                    },
                ),
                index: update(
                    this.state.index, {
                        $set: index,
                    },
                ),
                pageCount: update(
                    this.state.pageCount, {
                        $set: result.length,
                    },
                ),
            })

        } catch (e) {
            console.log(e)
        }
    }

    public render() {
        let blockIndex = 0
        if (this.state.blocks.length === 0) {
            return < div ></div >
        }
        if (this.state.redirect) {
            return <Redirect to={`/${this.state.selectedOption}/${this.state.searchWord}`} />
        }

        const blockLines: JSX.Element[] = []
        this.state.blocks.map((block: IBlock) => {
            blockLines.push(<BlockLine key={blockIndex++} block={block} />)
        })

        let hashRate = 1 / Number(this.state.blocks[0].difficulty) / (15 / Math.LN2)
        const rateUnit = this.getUnit(hashRate)
        hashRate = hashRate / this.getScale(hashRate)
        return (
            <div>

                <Grid container direction={"row"}>
                    <div style={{ float: "left", width: "48%" }} className="contentTitle">Latest Blocks </div>
                    <div style={{ float: "right", width: "48%", margin: "1% 1% 0% 0%", backgroundColor: "white" }}>
                        <span style={{ float: "right", color: "grey", fontSize: "25px", paddingTop: "2%" }}>
                            <span style={{ float: "right", color: "grey" }}>{hashRate.toFixed(3)} {rateUnit} </span><br />
                            <span style={{ float: "right", color: "grey", fontSize: "12px" }}>Network Hash Rate</span>
                        </span>
                    </div >
                </Grid>
                <div className="form-group">
                    <label htmlFor="select" >Search Options</label>
                    <select value={this.state.selectedOption} onChange={(data) => this.handleSelect(data)} className="form-control">
                        <option value="block">Blockhash</option>
                        <option value="address">Address</option>
                        <option value="tx">TxHash</option>
                    </select>
                </div>
                <TextField label="Search" placeholder={this.state.selectedOption}
                    onChange={(data) => this.handleSearchWord(data)}
                    onKeyPress={(event) => { if (event.key === "Enter") { this.searching(event) } }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={(event) => { this.searching(event) }}><Icon>search</Icon></IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                <div>
                    <span className="seeMoreLink">
                        <ReactPaginate
                            previousLabel={"PREV"}
                            nextLabel={"NEXT"}
                            breakLabel={<a>...</a>}
                            breakClassName={"break-me"}
                            pageCount={this.state.pageCount}
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
                                <th className="mdl-data-table__cell--non-numeric">Height</th>
                                <th className="mdl-data-table__cell--non-numeric">Age</th>
                                <th className="mdl-data-table__cell--numeric" style={{ paddingRight: "10%" }}>Transactions</th>
                                <th className="mdl-data-table__cell--numeric" style={{ paddingRight: "10%" }}>Uncles</th>
                                <th className="mdl-data-table__cell--numeric" style={{ paddingRight: "10%" }}>Total Sent</th>
                                <th className="mdl-data-table__cell--non-numeric">Miner Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {blockLines}
                        </tbody>
                    </table>
                </div>
            </div >
        )
    }

    private getScale(hashRate: number) {
        if (hashRate > 1000000000) {
            return 1000000000
        }
        if (hashRate > 1000000) {
            return 1000000
        }
        if (hashRate > 1000) {
            return 1000
        }
        return 1
    }

    private getUnit(hashRate: number) {
        if (hashRate > 1000000000) {
            return " GH/s"
        }
        if (hashRate > 1000000) {
            return " MH/s"
        }
        if (hashRate > 1000) {
            return " KH/s"
        }
        return " H/s"
    }

    private handleSelect(data: any) {
        this.setState({ selectedOption: data.target.value })
    }
    private handlePageClick = (data: any) => {
        this.getRecentBlockList(data.selected)
    }
    private handleSearchWord(data: any) {
        this.setState({ searchWord: data.target.value })
    }
    private searching(event: any) {
        if (this.state.searchWord === undefined) {
            event.preventDefault()
        } else if (!/^[a-zA-Z0-9]+$/.test(this.state.searchWord)) {
            event.preventDefault()
            alert(`Please enter a valid block hash consisting of numbers and English`)
        } else {
            this.setState({ redirect: true })
        }
    }
}
