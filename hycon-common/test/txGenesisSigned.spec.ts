import { randomBytes } from "crypto"
import { Address, GenesisSignedTx, proto } from "../lib/index"
import * as Long from "long"
import * as Secp from "secp256k1"

const secp256k1 = Secp

describe("GenesisSignedTx", () => {
    let addr: Address
    let sign: Uint8Array
    let tx: GenesisSignedTx
    let protoTx: proto.ITx

    beforeEach(() => {
        addr = new Address(randomBytes(20))
        sign = randomBytes(32)
        protoTx = { amount: 22, recovery: 1, signature: sign, to: addr }
    })

    it("constructor(tx, signature, recovery) : should set property using parameters", () => {
        const stx = new GenesisSignedTx({ amount: 22, to: addr }, sign, 1)
        expect(stx.signature.toString()).toBe(sign.toString())
        expect(stx.recovery).toBe(1)
    })

    it("constructor(tx, signature, recovery) : Exception - when two (signatures | recoverys) info exists", () => {
        function twoSigns() { protoTx.recovery = undefined; return new GenesisSignedTx(protoTx, sign, 1) }
        function twoRecovers() { protoTx.signature = undefined; protoTx.recovery = 1; return new GenesisSignedTx(protoTx, sign, 1) }
        expect(twoSigns).toThrowError()
        expect(twoRecovers).toThrowError()
    })

    it("set(tx) : method should set property using parameter", () => {
        tx = new GenesisSignedTx(protoTx)
        expect(tx.to).not.toBeUndefined()
        expect(tx.amount).not.toBeUndefined()
        expect(tx.signature).not.toBeUndefined()
        expect(tx.recovery).not.toBeUndefined()

        protoTx.amount = Long.fromNumber(22, true)
        tx = new GenesisSignedTx(protoTx)
        expect(tx.amount).not.toBeUndefined()
    })

    it("set(tx) Exception - when parameter is undefined / when amount is (negative | signed Long)", () => {
        tx = new GenesisSignedTx()

        // When parameter is undefined
        function undefTo() { return new GenesisSignedTx({ amount: 22, recovery: 1, signature: sign }) }
        function undefAmt() { return new GenesisSignedTx({ recovery: 1, signature: sign, to: addr }) }
        function undefSign() { return new GenesisSignedTx({ amount: 22, recovery: 1, to: addr }) }
        function undefRecover() { return new GenesisSignedTx({ amount: 22, signature: sign, to: addr }) }
        expect(undefTo).toThrowError()
        expect(undefAmt).toThrowError()
        expect(undefSign).toThrowError()
        expect(undefRecover).toThrowError()

        // when amount is negative
        function negAmt() { return new GenesisSignedTx({ amount: Long.fromNumber(-22, false), recovery: 1, signature: sign, to: addr }) }
        expect(negAmt).toThrowError()

        // when amount is signed Long
        function unsignAmt() { return new GenesisSignedTx({ amount: Long.fromNumber(22, false), recovery: 1, signature: sign, to: addr }) }
        expect(unsignAmt).toThrowError()
    })

    it("encode(): should return encoded data", () => {
        const encoder = jasmine.createSpyObj("encoder", ["finish"])
        const encodeSpy = spyOn(proto.Tx, "encode").and.returnValue(encoder)
        tx = new GenesisSignedTx()
        tx.encode()
        expect(encodeSpy).toHaveBeenCalled()
    })

    it("verify(): Exception - when tx is invalid", () => {
        protoTx.signature = randomBytes(10)
        tx = new GenesisSignedTx(protoTx)
        const res = tx.verify()
        expect(res).toBeFalsy()
    })
})
