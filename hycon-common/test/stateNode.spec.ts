import { randomBytes } from "crypto"
import { proto, StateNode } from "../lib/index"
import { } from "jasmine"
describe("StateNode test", () => {
    let stateNode: StateNode
    let protoStateNode: proto.IStateNode

    beforeEach(() => {
        protoStateNode = {
            nodeRefs: [{ address: randomBytes(32), child: randomBytes(32) }],
        }
    })

    it("constructor() : set properties account parameter not undefined", () => {
        stateNode = new StateNode(protoStateNode)
        expect(stateNode.nodeRefs.length).toEqual(protoStateNode.nodeRefs.length)
    })

    it("constructor() : method should set property using parameter.", () => {
        stateNode = new StateNode(protoStateNode)
        expect(stateNode.nodeRefs).not.toBeUndefined()
        expect(stateNode.nodeRefs.length).toBe(1)
    })

    it("constructor() : method should throw error when nodeRefs is undefined", () => {
        function result() {
            return stateNode = new StateNode({})
        }
        expect(result).toThrowError("nodeRefs is missing")
    })

    it("encode(): should return encoded data", () => {
        const encoder = jasmine.createSpyObj("encoder", ["finish"])
        const encodeSpy = spyOn(proto.StateNode, "encode").and.returnValue(encoder)
        stateNode = new StateNode()
        stateNode.encode()
        expect(encodeSpy).toHaveBeenCalled()
    })
})
