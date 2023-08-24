import {extensionOfPath} from "./deps.ts"
import {shortenSerialization, sortSerialization} from "./serialization-utils.ts"
import {writeJsonAsFile} from "../src-test/utils/json.ts"
import {asText} from "../src/m3/textual-syntax.ts"
import {deserializeLanguage} from "../src/m3/deserializer.ts"
import {lioncoreQName} from "../src/m3/lioncore.ts"


const isRecord = (json: unknown): json is Record<string, unknown> =>
    typeof json === "object" && !Array.isArray(json)

const isSerializedLanguage = (json: unknown): boolean =>
       isRecord(json)
    && json["serializationFormatVersion"] === "1"
    && "languages" in json
    && Array.isArray(json["languages"])
    && json["languages"].some((language) => isRecord(language) && language["key"] === lioncoreQName)


const verbose = async (path: string) => {
    try {
        const json = JSON.parse(await Deno.readTextFile(path))
        const extlessPath = path.substring(0, path.length - extensionOfPath(path).length)
        const sortedJson = sortSerialization(json)
        await writeJsonAsFile(extlessPath + ".sorted.json", sortedJson)
        await writeJsonAsFile(extlessPath + ".shortened.json", shortenSerialization(json))   // (could also sort)
        if (isSerializedLanguage(json)) {
            await Deno.writeTextFile(extlessPath + ".txt", asText(deserializeLanguage(json)))
        }
        console.log(`extracted: "${path}" -> "${extlessPath}"`)
    } catch (_) {
        console.error(`"${path}" is not a valid JSON file`)
    }
}


const main = (args: string[])=> {
    args.forEach(verbose)
}
main(Deno.args)

