import {builtinClassifiers, builtinPrimitives} from "./builtins.js"
import {LanguageFactory} from "./factory.js"
import {currentReleaseVersion} from "../version.js"


const lioncoreKey = "LionCore-M3"


const factory = new LanguageFactory(
    "LionCore_M3",
    currentReleaseVersion,
    (...names) =>
        "-id-" + (
            names.length === 1
                ? lioncoreKey
                : names.slice(1).join("-")
        ),
    (...names) => names.slice(1).join("-")
)
/*
 * ID: `-id-${key}`
 * key: qualified name _without_ "LionCore_M3", dash-separated
 */


/**
 * Definition of LionCore in terms of itself.
 */
export const lioncore = factory.language.havingKey("LionCore-M3")


const {inamed} = builtinClassifiers
const {booleanDatatype, stringDatatype} = builtinPrimitives


const ikeyed = factory.interface("IKeyed")
    .extending(inamed)

const ikeyed_key = factory.property(ikeyed, "key")
    .ofType(stringDatatype)


const feature = factory.concept("Feature", true).implementing(ikeyed)

const feature_optional = factory.property(feature, "optional")
    .ofType(booleanDatatype)


const property = factory.concept("Property", false, feature)

const property_type = factory.reference(property, "type")


const link = factory.concept("Link", true, feature)

const link_multiple = factory.property(link, "multiple")
    .ofType(booleanDatatype)

const link_type = factory.reference(link, "type")


const containment = factory.concept("Containment", false, link)


const reference = factory.concept("Reference", false, link)


const languageEntity = factory.concept("LanguageEntity", true)
    .implementing(ikeyed)


const classifier = factory.concept("Classifier", true, languageEntity)

const classifier_features = factory.containment(classifier, "features")
    .isOptional()
    .isMultiple()
    .ofType(feature)

link_type.ofType(classifier)


const annotation = factory.concept("Annotation", false, classifier)

const annotation_annotates = factory.reference(annotation, "annotates")
    .isOptional()
    .ofType(classifier)

const annotation_extends = factory.reference(annotation, "extends")
    .isOptional()
    .ofType(annotation)

const annotation_implements = factory.reference(annotation, "implements")
    .isMultiple()
    .isOptional()


const concept = factory.concept("Concept", false, classifier)

const concept_abstract = factory.property(concept, "abstract")
    .ofType(booleanDatatype)

const concept_partition = factory.property(concept, "partition")
    .ofType(booleanDatatype)

const concept_extends = factory.reference(concept, "extends")
    .isOptional()
    .ofType(concept)

const concept_implements = factory.reference(concept, "implements")
    .isOptional()
    .isMultiple()


const interface_ = factory.concept("Interface", false, classifier)

const interface_extends = factory.reference(interface_, "extends")
    .isOptional()
    .isMultiple()
    .ofType(interface_)

annotation_implements.ofType(interface_)
concept_implements.ofType(interface_)


const dataType = factory.concept("DataType", true, languageEntity)

property_type.ofType(dataType)


const primitiveType = factory.concept("PrimitiveType", false, dataType)


const enumeration = factory.concept("Enumeration", false, dataType)

const enumeration_literals = factory.containment(enumeration, "literals")
    .isMultiple()
    .isOptional()


const enumerationLiteral = factory.concept("EnumerationLiteral", false)
    .implementing(ikeyed)

enumeration_literals.ofType(enumerationLiteral)


const language = factory.concept("Language", false)
    .implementing(ikeyed)
    .isPartition()

const language_version = factory.property(language, "version")
    .ofType(stringDatatype)

const language_entities = factory.containment(language, "entities")
    .isOptional()
    .isMultiple()
    .ofType(languageEntity)

const language_dependsOn = factory.reference(language, "dependsOn")
    .isOptional()
    .isMultiple()
    .ofType(language)


export const metaConcepts = {
    annotation,
    concept,
    interface: interface_,
    containment,
    enumeration,
    enumerationLiteral,
    language,
    primitiveType,
    property,
    reference
}

export const metaFeatures = {
    annotation_annotates,
    annotation_extends,
    annotation_implements,
    classifier_features,
    concept_abstract,
    concept_partition,
    concept_extends,
    concept_implements,
    interface_extends,
    enumeration_literals,
    feature_optional,
    ikeyed_key,
    language_dependsOn,
    language_entities,
    language_version,
    link_multiple,
    link_type,
    property_type
}

export {lioncoreKey}

