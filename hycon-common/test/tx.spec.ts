import { randomBytes } from "crypto"
import { } from "jasmine"
import { getLogger } from "log4js"
import * as Long from "long"
import { Address, proto, Tx } from "../lib/index"

const logger = getLogger("Tx")

describe("Tx", () => {
    let addr1: Address
    let addr2: Address
    let tx: Tx
    let protoTx: proto.ITx

    beforeEach(() => {
        addr1 = new Address(randomBytes(20))
        addr2 = new Address(randomBytes(20))
        protoTx = {
            amount: 333,
            fee: 22,
            from: addr1,
            nonce: 1,
            to: addr2,
        }
    })

    it("set() : method should set property using parameter.", () => {
        tx = new Tx(protoTx)
        expect(tx.amount).not.toBeUndefined()
        expect(tx.fee).not.toBeUndefined()
        expect(tx.from).not.toBeUndefined()
        expect(tx.nonce).not.toBeUndefined()

        protoTx.amount = Long.fromNumber(333, true)
        protoTx.fee = Long.fromNumber(22, true)
        tx = new Tx(protoTx)
        expect(tx.amount).not.toBeUndefined()
        expect(tx.fee).not.toBeUndefined()
    })

    it("set() : Exception - when parameter is undefined / when amount or fee is signed Long", () => {
        tx = new Tx()

        // When parameter is undefined
        function undefFrom() { return new Tx({ amount: 333, fee: 22, nonce: 1 }) }
        function undefAmt() { return new Tx({ fee: 22, from: addr1, nonce: 1 }) }
        function undefFee() { return new Tx({ amount: 333, from: addr1, nonce: 1 }) }
        function undefNonce() { return new Tx({ amount: 333, fee: 22, from: addr1 }) }
        expect(undefFrom).toThrowError()
        expect(undefAmt).toThrowError()
        expect(undefFee).toThrowError()
        expect(undefNonce).toThrowError()

        // When amount or fee is signed Long
        function unsignAmt() { return new Tx({ amount: Long.fromNumber(333, false), fee: 22, from: addr1, nonce: 1, to: addr2 }) }
        function unsignFee() { return new Tx({ amount: 333, fee: Long.fromNumber(22, false), from: addr1, nonce: 1, to: addr2 }) }
        expect(unsignAmt).toThrowError()
        expect(unsignFee).toThrowError()
    })

    it("equals() : Should return true or false if two Txs are equal or not", () => {
        tx = new Tx(protoTx)
        expect(tx.equals(tx)).toBeTruthy()

        const tx1 = new Tx({ amount: 333, fee: 22, from: addr1, nonce: 1, to: addr1 })
        const tx2 = new Tx({ amount: 333, fee: 22, from: addr1, nonce: 1 })
        const tx3 = new Tx({ amount: 333, fee: 22, from: addr2, nonce: 1, to: addr2 })
        const tx4 = new Tx({ amount: 4444, fee: 22, from: addr1, nonce: 1, to: addr2 })
        const tx5 = new Tx({ amount: 333, fee: 132453, from: addr1, nonce: 1, to: addr2 })
        const tx6 = new Tx({ amount: 333, fee: 22, from: addr1, nonce: 22, to: addr2 })
        expect(tx.equals(tx1)).toBeFalsy()
        expect(tx2.equals(tx2)).toBeFalsy()
        expect(tx.equals(tx3)).toBeFalsy()
        expect(tx.equals(tx4)).toBeFalsy()
        expect(tx.equals(tx5)).toBeFalsy()
        expect(tx.equals(tx6)).toBeFalsy()
    })

    it("encode(): should return encoded data", () => {
        const encoder = jasmine.createSpyObj("encoder", ["finish"])
        const encodeSpy = spyOn(proto.Tx, "encode").and.returnValue(encoder)
        tx = new Tx()
        tx.encode()
        expect(encodeSpy).toHaveBeenCalled()
    })
})
