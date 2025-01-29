import {builtinPrimitives, concatenator, LanguageFactory, lastOf} from "@lionweb/core"

const factory = new LanguageFactory(
    "meta",
    "1",
    concatenator("-"),
    lastOf
)

/**
 * A "meta" language in which every instance of a meta concept has name "{A|a}[n]<name of meta concept>".
 * This is useful to test {@link ClassifierDeducer classifier deducers} with.
 */
export const metaLanguage = factory.language

factory.annotation("AnAnnotation")

const aConcept = factory.concept("AConcept", false)
factory.property(aConcept, "aProperty").ofType(builtinPrimitives.jsonDatatype)
factory.containment(aConcept, "aContainment").ofType(aConcept)
factory.reference(aConcept, "aReference").ofType(aConcept)

const anEnumeration = factory.enumeration("AnEnumeration")
factory.enumerationLiteral(anEnumeration, "anEnumerationLiteral")

factory.interface("AnInterface")

