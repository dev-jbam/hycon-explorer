import { Account, Hash, proto, StateNode } from "hycon-common"
export class DBState implements proto.IDBState {

    public static decode(data: Uint8Array): DBState {
        const state = proto.DBState.decode(data)
        return new DBState(state)
    }
    public account?: Account
    public node?: StateNode
    public refCount: number

    constructor(dbState: proto.IDBState)
    constructor(dbState: Account | StateNode, refCount?: number)
    constructor(dbState?: (proto.IDBState | Account | StateNode), refCount: number = 0) {
        if (dbState instanceof Account) {
            this.account = dbState
            this.refCount = refCount
        } else if (dbState instanceof StateNode) {
            this.node = dbState
            this.refCount = refCount
        } else if (dbState !== undefined) {
            this.set(dbState)
        }
    }

    public set(state: proto.IDBState): void {
        if (state.refCount === undefined) { throw new Error("refCount is missing in dbState") }
        if (state.account !== undefined && state.account !== null) {
            this.account = new Account(state.account)
        }
        if (state.node !== undefined && state.node !== null) {
            this.node = new StateNode(state.node)
        }
        this.refCount = state.refCount
    }

    public hash(): Hash {
        if (this.account !== undefined) {
            return new Hash(this.account)
        }
        return new Hash(this.node)
    }

    public encode(): Uint8Array {
        return proto.DBState.encode(this).finish()
    }
}
