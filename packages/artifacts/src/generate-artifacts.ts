import {writeFileSync} from "fs"

import {Language, lioncore, lioncoreBuiltins, serializeLanguages, serializeNodes} from "@lionweb/core"
import {
    languageAsText,
    generateMermaidForLanguage,
    generatePlantUmlForLanguage,
    GenerationOptions,
    languageInstantiationFor,
    tsTypesForLanguage,
    writeJsonAsFile
} from "@lionweb/utilities"
import {libraryLanguage} from "@lionweb/test/dist/languages/library.js"
import {multiLanguage} from "@lionweb/test/dist/languages/multi.js"
import {languageWithEnum} from "@lionweb/test/dist/languages/with-enum.js"
import {libraryExtractionFacade, libraryModel} from "@lionweb/test/dist/instances/library.js"
import {multiExtractionFacade, multiModel} from "@lionweb/test/dist/instances/multi.js"
import {shapesLanguage} from "@lionweb/test/dist/languages/shapes.js"
import {diagramPath, instancePath, languagePath} from "./paths.js"


writeFileSync(diagramPath( "metametamodel-gen.puml"), generatePlantUmlForLanguage(lioncore))
writeFileSync(diagramPath("metametamodel-gen.md"), generateMermaidForLanguage(lioncore))
console.log(`generated diagrams for LionCore M3`)

writeFileSync(diagramPath( "builtins.puml"), generatePlantUmlForLanguage(lioncoreBuiltins))
writeFileSync(diagramPath("builtins.md"), generateMermaidForLanguage(lioncoreBuiltins))
console.log(`generated diagrams for LionCore Built-ins`)


const saveLanguageFiles = (language: Language, name: string, ...generationOptions: GenerationOptions[]) => {
    writeJsonAsFile(languagePath(`${name}.json`), serializeLanguages(language))
    writeFileSync(languagePath(`${name}.txt`), languageAsText(language))
    writeFileSync(languagePath(`${name}-types.ts.txt`), tsTypesForLanguage(language, ...generationOptions))
        // (Generate with a '.txt' file extension to avoid it getting picked up by the compiler.)
    console.log(`saved files for ${language.name} M2`)
}


saveLanguageFiles(lioncore, "lioncore")
writeFileSync("C#-code/LionCore.cs", languageInstantiationFor(lioncore, "LionCore", "LionWeb.Core.M3"))
saveLanguageFiles(lioncoreBuiltins, "builtins")
writeFileSync("C#-code/BuiltIns.cs", languageInstantiationFor(lioncoreBuiltins, "BuiltIns", "LionWeb.Core.M2"))


saveLanguageFiles(shapesLanguage, "shapes", GenerationOptions.assumeSealed)
shapesLanguage.name = "ShapesLanguage"
writeFileSync("C#-code/ShapesLanguage.cs", languageInstantiationFor(shapesLanguage, "ShapesLanguage", "Examples.Shapes.M2"))


saveLanguageFiles(libraryLanguage, "library")

writeFileSync(diagramPath("library-gen.puml"), generatePlantUmlForLanguage(libraryLanguage))
writeFileSync(diagramPath("library-gen.md"), generateMermaidForLanguage(libraryLanguage))
console.log(`generated diagrams for Library M2`)

writeJsonAsFile(instancePath("library.json"), serializeNodes(libraryModel, libraryExtractionFacade))
console.log(`serialized library M1`)


saveLanguageFiles(languageWithEnum, "with-enum")
writeFileSync("C#-code/WithEnum.cs", languageInstantiationFor(languageWithEnum, "WithEnum", "Examples.M2"))


saveLanguageFiles(multiLanguage, "multi")

writeJsonAsFile(instancePath("multi.json"), serializeNodes(multiModel, multiExtractionFacade))
console.log(`serialized multi-language M1`)

