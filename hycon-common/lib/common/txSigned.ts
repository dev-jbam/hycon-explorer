import { getLogger } from "log4js"
import * as Long from "long"
import secp256k1 = require("secp256k1")
import { Address } from "../common/address"
import { PublicKey } from "../common/publicKey"
import * as proto from "../serialization/proto"
import { Hash } from "../util/hash"
import { signatureHash } from "./tx"
import { GenesisSignedTx } from "./txGenesisSigned"
const logger = getLogger("TxSigned")

export type AnySignedTx = (GenesisSignedTx | SignedTx)

export class SignedTx implements proto.ITx {
    public static decode(data: Uint8Array): SignedTx {
        const tx = proto.Tx.decode(data)
        return new SignedTx(tx)
    }
    public from: Address
    public to: Address
    public amount: Long
    public fee: Long
    public nonce: number
    public signature: Buffer
    public recovery: number
    public transitionSignature: Buffer
    public transitionRecovery: number

    constructor(tx: proto.ITx, signature?: Uint8Array, recovery?: number) {
        if (signature !== undefined) {
            if (tx.signature !== undefined) {
                throw new Error("Two signature information exists.")
            }
            tx.signature = signature
        }
        if (recovery !== undefined) {
            if (tx.recovery !== undefined) {
                throw new Error("Two recovery information exists.")
            }
            tx.recovery = recovery
        }

        if (tx.from === undefined) { throw (new Error("from address not defined in input")) }
        if (tx.amount === undefined) { throw (new Error("amount not defined in input")) }
        if (tx.fee === undefined) { throw (new Error("fee not defined in input")) }
        if (tx.nonce === undefined) { throw (new Error("nonce not defined in input")) }
        if (tx.signature === undefined) { throw (new Error("signature not defined in input")) }
        if (tx.recovery === undefined) { throw (new Error("recovery not defined in input")) }

        this.from = new Address(tx.from)
        if (tx.to !== undefined && tx.to.length > 0) {
            this.to = new Address(tx.to)
        }
        this.amount = tx.amount instanceof Long ? tx.amount : Long.fromNumber(tx.amount, true)
        if (this.amount.lessThan(0)) {
            throw new Error("Transaction amount can not be negative")
        }
        this.fee = tx.fee instanceof Long ? tx.fee : Long.fromNumber(tx.fee, true)
        if (this.fee.lessThan(0)) {
            throw new Error("Transaction fee can not be negative")
        }
        if (!this.amount.unsigned || !this.fee.unsigned) {
            logger.fatal(`Protobuf problem with SignedTx (amount | fee) `)
            throw new Error("Protobuf problem with SignedTx (amount | fee) ")
        }
        this.nonce = tx.nonce

        // After decode singedTx, if there isnt transitionSignatrue and transitionRecovery, they will be Buffer[0] and 0.
        if (tx.transitionSignature !== undefined && tx.transitionSignature.length > 0) {
            this.transitionSignature = Buffer.from(tx.transitionSignature as Buffer)
            if (tx.transitionRecovery !== undefined) { this.transitionRecovery = tx.transitionRecovery }
        }

        this.signature = Buffer.from(tx.signature as Buffer)
        this.recovery = tx.recovery
    }
    public encode(): Uint8Array {
        return proto.Tx.encode(this).finish()
    }

    public verify(legacy: boolean): boolean {
        // Consensus Critical
        try {
            if (this.signature === undefined || this.recovery === undefined) { return false }
            let hash
            if (legacy) {
                hash = new Hash(this).toBuffer()
            } else {
                hash = signatureHash(this).toBuffer()
            }
            const pubKey = new PublicKey(secp256k1.recover(hash, this.signature, this.recovery))
            const address = pubKey.address()
            if (!this.from.equals(address)) { return false }
            return secp256k1.verify(hash, this.signature, pubKey.pubKey)
        } catch (e) {
            return false
        }
    }
}
