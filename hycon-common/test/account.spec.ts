import { } from "jasmine"
import { configure } from "log4js"
import { Account, proto } from "../lib/index"

configure({
    appenders: {
        console: { type: "log4js-protractor-appender" },
    },
    categories: {
        default: { appenders: ["console"], level: "debug" },
    },
})
describe("Account test", () => {
    let account: Account
    let protoAccount: proto.IAccount

    beforeEach(() => {
        protoAccount = {
            balance: 10000, nonce: 0,
        }
    })

    it("constructor() : call set method when account parameter not undefined", () => {
        account = new Account(protoAccount)
        expect(account.balance.toString()).toEqual(protoAccount.balance.toString())
        expect(account.nonce.toString()).toEqual(protoAccount.nonce.toString())
    })

    it("constructor() : method should set property using parameter.", () => {
        account = new Account(protoAccount)
        expect(account.balance).not.toBeUndefined()
        expect(account.nonce).not.toBeUndefined()
    })

    it("constructor() : method should throw error when balance is undefined", () => {
        function result() {
            account = new Account({ nonce: 0 })
        }
        expect(result).toThrowError("Balance is missing")
    })

    it("constructor() : method should throw error when nonce is undefined", () => {
        function result() {
            return account = new Account({ balance: 1000 })
        }
        expect(result).toThrowError("Nonce is missing")
    })

    it("encode(): should return encoded data", () => {
        const encoder = jasmine.createSpyObj("encoder", ["finish"])
        const encodeSpy = spyOn(proto.Account, "encode").and.returnValue(encoder)
        account = new Account()
        account.encode()
        expect(encodeSpy).toHaveBeenCalled()
    })
})
