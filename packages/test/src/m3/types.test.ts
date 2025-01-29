import {assert} from "chai"
const {equal} = assert

import {concatenator, LanguageFactory, lastOf} from "@lionweb/core"


describe("M3 types", () => {

    it("factory performs auto-containment, but also prevents duplication", () => {
        const factory = new LanguageFactory("TestLanguage", "0", concatenator("-"), lastOf)
        const {language} = factory

        const concept = factory.concept("Concept", false)
        equal(language.entities.length, 1)
        language.havingEntities(concept)
        equal(language.entities.length, 1)

        const containment = factory.containment(concept, "containment")
        equal(concept.features.length, 1)
        concept.havingFeatures(containment)
        equal(concept.features.length, 1)

        const enumeration = factory.enumeration("enumeration")
        const literal = factory.enumerationLiteral(enumeration, "literal")
        equal(enumeration.literals.length, 1)
        enumeration.havingLiterals(literal)
        equal(enumeration.literals.length, 1)
    })

})

