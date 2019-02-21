import { randomBytes } from "crypto"
import { Address, GenesisTx, proto } from "../lib/index"
import { getLogger } from "log4js"
import * as Long from "long"

const logger = getLogger("GenesisTx")

describe("GenesisTx", () => {
    let addr1: Address
    let addr2: Address
    let tx: GenesisTx
    let protoGenTx: proto.ITx

    beforeEach(() => {
        addr1 = new Address(randomBytes(20))
        addr2 = new Address(randomBytes(20))
        protoGenTx = { amount: 4444, to: addr1 }
    })

    it("set() : method should set property using parameter.", () => {
        tx = new GenesisTx(protoGenTx)
        expect(tx.amount).not.toBeUndefined()

        protoGenTx.amount = Long.fromNumber(4444, true)
        tx = new GenesisTx(protoGenTx)
        expect(tx.amount).not.toBeUndefined()
    })

    it("set() : Exception - when parameter is undefined / when amount is signed Long", () => {
        tx = new GenesisTx()

        // When parameter is undefined
        function undefTo() { return new GenesisTx({ amount: 4444 }) }
        function undefAmt() { return new GenesisTx({ to: addr1 }) }
        expect(undefTo).toThrowError()
        expect(undefAmt).toThrowError()

        // When amount is signed Long
        function unsignAmt() { return new GenesisTx({ amount: Long.fromNumber(4444, false), to: addr2 }) }
        expect(unsignAmt).toThrowError()
    })

    it("equals() : Should return true or false if two GenesisTxs are equal or not", () => {
        tx = new GenesisTx(protoGenTx)
        expect(tx.equals(tx)).toBeTruthy()

        const tx1 = new GenesisTx({ amount: 4444, to: addr2 })
        const tx2 = new GenesisTx({ amount: 333, to: addr1 })
        expect(tx.equals(tx1)).toBeFalsy()
        expect(tx.equals(tx2)).toBeFalsy()
    })

    it("encode(): should return encoded data", () => {
        const encoder = jasmine.createSpyObj("encoder", ["finish"])
        const encodeSpy = spyOn(proto.Tx, "encode").and.returnValue(encoder)
        tx = new GenesisTx()
        tx.encode()
        expect(encodeSpy).toHaveBeenCalled()
    })
})
