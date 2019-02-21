import * as React from "react"
import { RouteComponentProps } from "react-router"
import { RouteConfig } from "react-router-config"
import { Link, Route, Switch } from "react-router-dom"
import { BlockView } from "./blockView"
import { Home } from "./home"

// import { TxPoolList } from "./txPoolList"
import { TxView } from "./txView"

import { AccountInfo } from "./accountInfo"
import { AccountList } from "./accountList"
import { Rest } from "./restv2"
import { UncleView } from "./uncleView"

export const routes: RouteConfig[] = [
    { exact: true, path: "/" },
    { exact: true, path: "/tx/:hash" },
    { exact: true, path: "/block/:hash" },
    { exact: true, path: "/uncle/:hash" },
    { exact: true, path: "/txPool" },
    { exact: true, path: "/address/:hash" },
    { exact: true, path: "/address" },
]

// tslint:disable:no-shadowed-variable
export class App extends React.Component<{ rest: Rest }, any> {
    public rest: Rest
    public blockView: ({ match }: RouteComponentProps<{ hash: string }>) => JSX.Element
    public uncleView: ({ match }: RouteComponentProps<{ hash: string }>) => JSX.Element
    public home: ({ match }: RouteComponentProps<{}>) => JSX.Element
    public accountInfo: (
        { match }: RouteComponentProps<{ hash: string }>,
    ) => JSX.Element

    public accountList: (
        { match }: RouteComponentProps<{}>) => JSX.Element
    public txView: ({ match }: RouteComponentProps<{ hash: string }>) => JSX.Element

    public notFound: boolean

    constructor(props: any) {
        super(props)
        this.state = {
            block: "block",
            isParity: false,
            loading: false,
            name: "BlockExplorer",
            tx: "Tx 1",
        }
        this.rest = props.rest
        this.rest.loadingListener((loading: boolean) => {
            // this.setState({ loading })
        })
        this.accountList = ({ match }: RouteComponentProps<{}>) => (
            <AccountList rest={this.rest} />
        )
        this.blockView = ({ match }: RouteComponentProps<{ hash: string }>) => (
            <BlockView hash={match.params.hash} rest={this.rest} notFound={this.notFound} />
        )

        this.uncleView = ({ match }: RouteComponentProps<{ hash: string }>) => (
            <UncleView hash={match.params.hash} rest={this.rest} />
        )
        this.home = ({ match }: RouteComponentProps<{}>) => (
            <Home rest={props.rest} />
        )
        this.accountInfo = ({ match }: RouteComponentProps<{ hash: string }>) => (
            <AccountInfo hash={match.params.hash} rest={this.rest} />
        )
        this.txView = ({ match }: RouteComponentProps<{ hash: string }>) => (
            <TxView hash={match.params.hash} rest={this.rest} />
        )

    }

    public render() {
        return (
            <div className="mdl-layout mdl-js-layout mdl-layout--fixed-header">
                <header className="mdl-layout__header" >
                    <div className="mdl-layout__header-row" style={{ marginLeft: -60 }}>
                        <Link to="/">
                            <img src="/hycon-logo.png" style={{ outline: 0 }} height="42" width="42" />
                        </Link>
                        <Link to="/">
                            <div className="mdl-navigation__link">
                                <span className="mdl-layout-title">Hycon Block Explorer</span>
                            </div>
                        </Link>

                        <div className="mdl-layout-spacer" />
                        <nav className="mdl-navigation">
                            <Link className="mdl-navigation__link" to="/address">Addresses</Link>
                        </nav>
                    </div>
                    <div className={`mdl-progress mdl-js-progress progressBar ${this.state.loading ? "mdl-progress__indeterminate" : "mdl-progress__determinate"}`} />
                </header>
                <main className="mdl-layout__content main">
                    <div className="page-content">
                        <Switch>
                            {/* <Route exact path='/' component={() => { return <Home name={this.state.name} /> }} /> */}
                            <Route exact path="/" component={this.home} />
                            <Route exact path="/tx/:hash" component={this.txView} />
                            <Route exact path="/block/:hash" component={this.blockView} />
                            <Route exact path="/uncle/:hash" component={this.uncleView} />
                            <Route exact path="/address/:hash" component={this.accountInfo} />
                            <Route exact path="/address" component={this.accountList} />
                        </Switch>
                    </div>
                </main>
            </div>
        )
    }
}
