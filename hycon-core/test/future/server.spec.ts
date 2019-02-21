import { randomBytes } from "crypto"
import { proto } from "hycon-common"
import { SignedTx } from "hycon-common"
import { BlockHeader } from "hycon-common"
import { Address } from "hycon-common"
import { Block } from "hycon-common"
import { GenesisBlock } from "hycon-common"
import { } from "jasmine"
import * as levelup from "levelup"
import * as Long from "long"
import * as net from "net"
import { Database } from "../src/consensus/database/database"
import { DBBlock } from "../src/consensus/database/dbblock"
import { DBState } from "../src/consensus/database/dbState"
import { TxList } from "../src/consensus/database/txList"
import { PeerList } from "../src/network/rabbit/peerList"
import { Packet } from "../src/network/turtle/packet"
import { UpnpClient } from "../src/network/upnp"
import { UpnpServer } from "../src/network/upnp"
import { Server } from "../src/server"
import * as utils from "../src/util/difficulty"
import { Hash } from "../src/util/hash"
import { testAsync } from "./async"

describe("Server", () => {
    let server: Server
    const netServer: jasmine.SpyObj<net.Server> = jasmine.createSpyObj("netServer", ["on", "listen"])
    const dbObj: jasmine.SpyObj<Database> = jasmine.createSpyObj("database", ["constructor"])
    let iDBBlock: proto.IBlockDB
    let iBlockHeader: proto.IBlockHeader
    let originalTimeout: number
    let testPrevious: DBBlock
    let itx: proto.ITx

    beforeAll(() => {
        spyOn(UpnpClient.prototype, "run")
        spyOn(UpnpServer.prototype, "run")
        spyOn(net, "createServer").and.returnValue(netServer)
        server = new Server()

        iBlockHeader = {
            difficulty: 33,
            merkleRoot: new Hash("Merkle root"),
            nonce: 1234,
            previousHash: [new Hash("Previous Block")],
            timeStamp: Date.now(),
            stateRoot: new Hash("State root"),
        }
        iDBBlock = {
            header: iBlockHeader,
            fileNumber: 0,
            height: 1,
            length: 100,
            offset: 10,
        }
        itx = {
            from: new Address(randomBytes(20)), to: new Address(randomBytes(20)),
            amount: 10000, fee: 100, nonce: 1234,
            signature: randomBytes(32), recovery: 10,
        }
        testPrevious = new DBBlock(iDBBlock)
    })
    beforeEach(() => {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
    })
    afterEach(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout
    })
    afterAll(() => {
        delete server.db
    })
    it("Should create a server to listen for sockets", () => {
        expect(net.createServer).toHaveBeenCalled()
    })
    it("Should assign the port to the default port if not specified", () => {
        expect(server.options.port).toBe(8148)
    })
    it("Should start the server listening", () => {
        expect(netServer.listen).toHaveBeenCalled()
    })
    it("Should initialise the database", () => {
        expect(server.db).toBeDefined()
        expect(server.db).toBeDefined()
    })
})
