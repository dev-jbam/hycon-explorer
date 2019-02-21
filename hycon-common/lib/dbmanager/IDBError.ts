enum errorCode {
    FAILED = -1,
    SUCCESS = 0,
    NON_RIGHT_ORDER = 1,
    ENTITY_NOT_FOUND = 2,
    DUPLICATED_PRIMARY = 1062,
}

export class DBError extends Error {

    public static readonly FAILED = -1
    public static readonly NON_RIGHT_ORDER = 1
    public static readonly ENTITY_NOT_FOUND = 2
    public static readonly DUPLICATED_PRIMARY = 1062
    public code: number
    public codeName: string

    constructor(code?: number) {
        super()

        if (code !== undefined) {
            this.code = code
            this.codeName = errorCode[code]
        }

    }
}
