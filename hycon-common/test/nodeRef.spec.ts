import { randomBytes } from "crypto"
import { Hash, NodeRef, proto } from "../lib/index"
describe("NodeRef test", () => {
    let nodeRef: NodeRef
    let protoNodeRef: proto.INodeRef

    beforeEach(() => {
        protoNodeRef = {
            address: randomBytes(32), child: randomBytes(32),
        }
    })

    it("constructor() : call set method when account parameter not undefined", () => {
        nodeRef = new NodeRef(protoNodeRef)
        expect(nodeRef.address.toString()).toEqual(protoNodeRef.address.toString())
        const hashString = (new Hash(protoNodeRef.child)).toString()
        expect(nodeRef.child.toString()).toEqual(hashString)
    })

    it("constructor() : method should set property using parameter.", () => {
        nodeRef = new NodeRef(protoNodeRef)
        expect(nodeRef.address).not.toBeUndefined()
        expect(nodeRef.child).not.toBeUndefined()
    })

    it("constructor() : method should throw error when address is undefined", () => {
        function result() {
            return new NodeRef({ child: randomBytes(32) })
        }
        expect(result).toThrowError("address is missing")
    })

    it("constructor() : method should throw error when child is undefined", () => {
        function result() {
            return new NodeRef({ address: randomBytes(32) })
        }
        expect(result).toThrowError("child is missing")
    })
})
