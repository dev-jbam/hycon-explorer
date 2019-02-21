export { Account } from "./common/account"
export { Address } from "./common/address"
export { AsyncLock } from "./common/asyncLock"
export { AnyBlock, Block } from "./common/block"
export { ConsensusFactor } from "./common/consensusFactor"
export { GenesisBlock } from "./common/blockGenesis"
export { AnyBlockHeader, BlockHeader } from "./common/blockHeader"
export { DelayQueue } from "./common/delayQueue"
export { BaseBlockHeader, GenesisBlockHeader, setGenesisBlockHeader } from "./common/genesisHeader"
export { NodeRef } from "./common/nodeRef"
export { PriorityQueue } from "./common/priorityQueue"
export { PrivateKey } from "./common/privateKey"
export { PublicKey } from "./common/publicKey"
export { RobustPromises } from "./common/robustPromises"
export { StateNode } from "./common/stateNode"
export { Tx, signatureHash } from "./common/tx"
export { GenesisTx } from "./common/txGenesis"
export { GenesisSignedTx } from "./common/txGenesisSigned"
export { SignedTx, AnySignedTx } from "./common/txSigned"
export { Hash } from "./util/hash"
export { encodingMnemonic, hyconfromString, hycontoString, zeroPad } from "./util/stringUtil"
export { AccountEntity } from "./dbmanager/entity/accountEntity"
export { BlockEntity } from "./dbmanager/entity/blockEntity"
export { DBManager } from "./dbmanager/DBManager"
export { ConnectionOptions } from "typeorm"
export { DBError } from "./dbmanager/IDBError"
export { TxEntity } from "./dbmanager/entity/txEntity"
export { IUncle } from "./dbmanager/entity/uncleEntity"
import * as proto from "./serialization/proto"
export { proto }

import { configure } from "log4js"
configure({
    appenders: {
        console: {
            type: "stdout",
        },
        fileLogs: {
            filename: `./logs/${new Date().getFullYear()}-${(new Date().getMonth()) + 1}-${new Date().getDate()}/common_logFile.log`,
            keepFileExt: true,
            maxLogSize: 16777216,
            pattern: ".yyyy-MM-dd",
            type: "dateFile",
        },
    },
    categories: {
        default: { appenders: ["console", "fileLogs"], level: "info" },
    },
})
