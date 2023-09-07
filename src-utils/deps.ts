// for src-utils/m3/diagrams/*-generator.ts:
import {asString, indentWith, NestedString} from "npm:littoral-templates@0.2.2"

// for src-utils/id-generation.ts:
import {createHash} from "https://deno.land/std@0.177.0/node/crypto.ts"
// Note: this breaks from version 0.178.0 onwards!
import {nanoid} from "npm:nanoid@4.0.2"


export {
    asString,
    createHash,
    indentWith,
    nanoid
}


export type {
    NestedString
}
