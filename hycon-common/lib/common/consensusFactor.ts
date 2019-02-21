import Long = require("long")
export class ConsensusFactor {
    public static exodusHeight = 404540
    public static lastNakamotoBlock = 317713
    public static lastGhostBlock = 444444
    public static networkid: string = "hycon"
    public static readonly uncleRewardR = 75 / 100
    public static readonly uncleRewardA = 0.9 / ConsensusFactor.uncleRewardR
    public static uncleReward(mineReward: number, heightDelta: number) {
        const factor = ConsensusFactor.uncleRewardA * Math.pow(ConsensusFactor.uncleRewardR, heightDelta)
        return Long.fromNumber(factor * mineReward, true)
    }

    public static getReward(height: number) {
        if (height <= this.lastNakamotoBlock) {
            return 240e9
        } else if (height <= this.lastGhostBlock) {
            return 120e9
        }
        return 12e9
    }
}
