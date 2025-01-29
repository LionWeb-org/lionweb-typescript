import {deepEqual, equal} from "assert"
import {serializeLanguages, serializeNodes} from "@lionweb/core"
import {
    deriveLikelyPropertyName,
    inferLanguagesFromSerializationChunk,
    sortedSerializationChunk
} from "@lionweb/utilities"

import {libraryExtractionFacade, libraryModel} from "./instances/library.js"
import {minimalLibraryLanguage} from "./languages/minimal-library.js"
import {multiExtractionFacade, multiModel} from "./instances/multi.js"
import {multiLanguage} from "./languages/multi.js"


describe("inferLanguagesFromChunk", () => {

    it("should correctly infer the minimal library language from the instance", () => {
        const serializationChunk = serializeNodes(libraryModel, libraryExtractionFacade)

        const languages = inferLanguagesFromSerializationChunk(serializationChunk)
        equal(languages.length, 1)
        const inferredLanguage = languages[0]

        deepEqual(sortedSerializationChunk(serializeLanguages(inferredLanguage)), sortedSerializationChunk(serializeLanguages(minimalLibraryLanguage)))
    })

    it("should correctly infer the multi language from the instance", () => {
        const serializationChunk = serializeNodes(multiModel, multiExtractionFacade)

        const languages = inferLanguagesFromSerializationChunk(serializationChunk)
        equal(languages.length, 2)
        const inferredMultiLanguage = languages[0]
        const inferredLibraryLanguage = languages[1]

        // (we can't infer the language dependency)
        inferredMultiLanguage.dependingOn(inferredLibraryLanguage)

        deepEqual(sortedSerializationChunk(serializeLanguages(inferredLibraryLanguage)), sortedSerializationChunk(serializeLanguages(minimalLibraryLanguage)))
        deepEqual(sortedSerializationChunk(serializeLanguages(inferredMultiLanguage)), sortedSerializationChunk(serializeLanguages(multiLanguage)))
    })

})

describe("deriveLikelyPropertyName", () => {

    describe("for supported formats", () => {
        ["-", "_"].forEach(separator => {
            const propertyKey = ["languageKey", "classifierKey", "propertyKey"].join(separator)
            it(`should derive the property name when using separator '${separator}'`, () => {
                equal(deriveLikelyPropertyName(propertyKey), "propertyKey")
            })
        })
    })

    describe("for unsupported formats", () => {
        const propertyKey = "classifierKey$propertyKey"
        it("should return the entire key", () => {
            equal(deriveLikelyPropertyName(propertyKey), propertyKey)
        })
    })

})

