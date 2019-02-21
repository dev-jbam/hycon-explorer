// tslint:disable-next-line:no-var-requires
const cryptonight = require("node-cryptonight").asyncHash

export async function hashCryptonight(ob: Uint8Array | string): Promise<Uint8Array> {
    // Consensus Critical
    if (typeof ob === "string") {
        ob = Buffer.from(ob)
    }
    return new Promise<Uint8Array>((resolve, reject) => {
        cryptonight(ob, (hash: any) => {
            return resolve(new Uint8Array(hash))
        })
    })
}
