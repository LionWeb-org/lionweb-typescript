import {extractFromSerialization} from "./serialization-extractor.ts"
import {diagramFromSerialization} from "./m3/diagram-generator.ts"


const main = (args: string[])=> {
    if (args.length === 0) {
        console.log(
`lioncore-cli is a LIonWeb utility around LIonCore-TypeScript

Usage: $ lioncore-cli <command> <arguments>

Commands are:

    extract
`
        )
        return
    }

    const command = args[0]
    switch (command) {

        case "diagram": {
            if (args.length === 1) {
                console.log(
                    `The diagram command generates a PlantUML and Mermaid diagram for the language that the given paths point to.`
                )
            } else {
                args.slice(1).forEach(diagramFromSerialization)
            }
            return
        }

        case "extract": {
            if (args.length === 1) {
                console.log(
`The extract command extracts the following from a serialization chunk in the form of files: a sorted JSON, and a shortened JSON.
If the chunk is the serialization of a LIonCore Language/M2, then a textual rendering is already output.`
                )
            } else {
                args.slice(1).forEach(extractFromSerialization)
            }
            return
        }

        // TODO  schema, Ecore import

        default: {
            console.error(`command "${command}" is not recognized`)
        }
    }

}

main(Deno.args)
