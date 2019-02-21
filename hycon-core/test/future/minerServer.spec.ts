import { randomBytes } from "crypto"
import { Address } from "hycon-common"
import { Block } from "hycon-common"
import { BlockHeader } from "hycon-common"
import { Hash } from "hycon-common"
import { proto } from "hycon-common"
import * as Long from "long"
import { DBState } from "../src/consensus/database/dbState"
import { CpuMiner } from "../src/miner/cpuMiner"
import { MinerServer } from "../src/miner/minerServer"
import { StratumServer } from "../src/miner/StratumServer"
import { Server } from "../src/server"
import * as utils from "../src/util/difficulty"
import { testAsync } from "./async"

describe("Mining test", () => {
    let iBlockHeader: proto.IBlockHeader
    let iBlock: proto.IBlock
    beforeAll(() => {
        iBlockHeader = {
            difficulty: 1,
            nonce: 0,
            timeStamp: Date.now(),
            merkleRoot: new Hash("Merkle root"),
            previousHash: [new Hash("Previous hash")],
            stateRoot: new Hash("state Root"),
        }
        iBlock = {
            header: iBlockHeader,
            txs: [],
            miner: new Address(randomBytes(20)),
        }
    })

    beforeEach(() => {
        spyOn(StratumServer.prototype, "putWork")
        spyOn(BlockHeader.prototype, "preHash").and.returnValue(new Hash(randomBytes(32)))
        spyOn(Uint8Array.prototype, "subarray").and.callThrough()
        spyOn(Long, "fromNumber").and.callThrough()
        spyOn(Long, "fromString").and.callThrough()
    })
})
