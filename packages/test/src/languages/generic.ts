import {chain, concatenator, LanguageFactory, lastOf} from "@lionweb/core"
import {hasher} from "@lionweb/utilities"


const factory = new LanguageFactory(
    "Generic",
    "0",
    chain(concatenator("-"), hasher({ encoding: "base64" })),
    lastOf
)
export const genericLanguage = factory.language

export const SomeConcept = factory.concept("SomeConcept", false)
export const AnotherConcept = factory.concept("AnotherConcept", false)

export const SomeConcept_ref = factory.reference(SomeConcept, "ref").ofType(AnotherConcept).isOptional()
export const SomeConcept_refs = factory.reference(SomeConcept, "refs").ofType(AnotherConcept).isMultiple()

export const SomeAnnotation = factory.annotation("SomeAnnotation")
SomeAnnotation.annotates = AnotherConcept
export const SomeAnnotation_ref = factory.reference(SomeAnnotation, "ref").ofType(SomeConcept)

