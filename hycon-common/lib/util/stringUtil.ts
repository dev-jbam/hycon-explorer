import Long = require("long")
export function zeroPad(input: string, length: number) {
    return (Array(length + 1).join("0") + input).slice(-length)
}

const zeroPadder = ["0", "00", "000", "0000", "00000", "000000", "0000000", "00000000", "00000000"]

function formatNumber(decimal: string) {
    let result = ""
    const mod = decimal.length % 3
    const numberUnits = Math.floor(decimal.length / 3)
    result = decimal.substring(0, mod)

    for (let i = 0; i < numberUnits; ++i) {
        const startIdx = (i * 3 + mod)
        result = result + ("," + decimal.substring(startIdx, startIdx + 3))
    }
    result = result[0] === "," ? result.substring(1) : result
    return result
}
export function hycontoString(val: Long, formating?: boolean): string {
    formating = formating === undefined ? false : formating
    const decimal = val.divide(1000000000)
    const fraction = val.modulo(1000000000)
    const decimalStr = formating ? formatNumber(decimal.toString()) : decimal.toString()

    if (fraction.isZero()) {
        return decimalStr
    }

    let fractionStr = fraction.toString()
    const fractionLength: number = fractionStr.length
    fractionStr = fractionLength < 9 ? zeroPadder[8 - fractionLength] + fractionStr : fractionStr

    while (fractionStr.charAt(fractionStr.length - 1) === "0") {
        fractionStr = fractionStr.substr(0, fractionStr.length - 1)
    }

    return decimalStr + "." + fractionStr
}

export function hyconfromString(val: string): Long {
    if (val === "" || val === undefined || val === null) { return Long.fromNumber(0, true) }
    if (val[val.length - 1] === ".") { val += "0" }
    const arr = val.toString().split(".")
    let hycon = Long.fromString(arr[0], true).multiply(Math.pow(10, 9))
    if (arr.length > 1) {
        arr[1] = arr[1].length > 9 ? arr[1].slice(0, 9) : arr[1]
        const subCon = Long.fromString(arr[1], true).multiply(Math.pow(10, 9 - arr[1].length))
        hycon = hycon.add(subCon)
    }
    return hycon.toUnsigned()
}
export function encodingMnemonic(str: string): string {
    return str.normalize("NFKD")
}
