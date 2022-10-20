import {
    Concept,
    ConceptInterface,
    Containment,
    Enumeration,
    EnumerationLiteral,
    Metamodel,
    Multiplicity,
    PrimitiveType,
    Property,
    Reference
} from "./types.ts"


// Definition of LIonCore in terms of itself.


const stringDatatype = new PrimitiveType("String")

const booleanDatatype = new PrimitiveType("boolean")


const namespaceProvider_namespaceQualifier = new Property("namespaceQualifier", Multiplicity.Single)
    .isDerived()
    .ofType(stringDatatype)

const namespaceProvider = new ConceptInterface("NamespaceProvider")
    .havingFeatures(namespaceProvider_namespaceQualifier)


const namespacedEntity_simpleName = new Property("simpleName", Multiplicity.Single)
    .ofType(stringDatatype)

const namespacedEntity_qualifiedName = new Property("qualifiedName", Multiplicity.Single)
    .isDerived()
    .ofType(stringDatatype)

const namespacedEntity_container = new Reference("container", Multiplicity.Single)
    .ofType(namespaceProvider)

const namespacedEntity = new Concept("NamespacedEntity", true)
    .havingFeatures(
        namespacedEntity_simpleName,
        namespacedEntity_qualifiedName,
        namespacedEntity_container
    )


const metamodel_qualifiedName = new Property("qualifiedName", Multiplicity.Single)
    .ofType(stringDatatype)

const metamodel_elements = new Containment ("elements", Multiplicity.ZeroOrMore)

const metamodel_dependsOn = new Reference("dependsOn", Multiplicity.ZeroOrMore)

const metamodel = new Concept("Metamodel", false)
    .havingFeatures(metamodel_qualifiedName, metamodel_elements, metamodel_dependsOn)
    .implementing(namespaceProvider)
metamodel_dependsOn.ofType(metamodel)


const metamodelElement = new Concept("MetamodelElement", true, namespacedEntity)


metamodel_elements.ofType(metamodelElement)


const featuresContainer_features = new Containment("features", Multiplicity.ZeroOrMore)

const featuresContainer_allFeatures = new Reference("allFeatures", Multiplicity.ZeroOrMore)
    .isDerived()

const featuresContainer = new Concept("FeaturesContainer", true, metamodelElement)
    .havingFeatures(
        featuresContainer_features,
        featuresContainer_allFeatures
    )
    .implementing(namespaceProvider)


const concept_abstract = new Property("abstract", Multiplicity.Single)
    .ofType(booleanDatatype)

const concept_extends = new Reference("extends", Multiplicity.Optional)

const concept_implements = new Reference("implements", Multiplicity.ZeroOrMore)

const concept = new Concept("Concept", false, featuresContainer)
    .havingFeatures(
        concept_abstract,
        concept_extends,
        concept_implements
    )
concept_extends.ofType(concept)


const conceptInterface_extends = new Reference("extends", Multiplicity.ZeroOrMore)

const conceptInterface = new Concept("ConceptInterface", false, featuresContainer)
    .havingFeatures(conceptInterface_extends)

conceptInterface_extends.ofType(conceptInterface)
concept_implements.ofType(conceptInterface)


const annotation_platformSpecific = new Property("platformSpecific", Multiplicity.Optional)
    .ofType(stringDatatype)

const annotation_target = new Reference("target", Multiplicity.Single)
    .ofType(featuresContainer)

const annotation = new Concept("Annotation", false, featuresContainer)
    .havingFeatures(
        annotation_platformSpecific,
        annotation_target
    )
// Note: annotations can be defined on M2-level, and then instantiated on M1-level.


const multiplicity = new Enumeration("Multiplicity")
multiplicity.literals.push(
    new EnumerationLiteral("Optional"),
    new EnumerationLiteral("Single"),
    new EnumerationLiteral("ZeroOrMore"),
    new EnumerationLiteral("OneOrMore")
)


const feature_multiplicity = new Property("multiplicity", Multiplicity.Single)
    .ofType(multiplicity)

const feature_derived = new Property("derived", Multiplicity.Single)
    .ofType(booleanDatatype)

const feature = new Concept("Feature", true, namespacedEntity)
    .havingFeatures(
        feature_multiplicity,
        feature_derived
    )

featuresContainer_allFeatures.type = feature
featuresContainer_features.type = feature


const link_type = new Reference("type", Multiplicity.Single)
    .ofType(featuresContainer)

const link = new Concept("Link", true, feature)
    .havingFeatures(link_type)


const reference_specializes = new Reference("specializes", Multiplicity.Optional)

const reference = new Concept("Reference", false, link)
    .havingFeatures(reference_specializes)
reference_specializes.ofType(reference)


const property_type = new Reference("type", Multiplicity.Single)

const property = new Concept("Property", false, feature)
    .havingFeatures(property_type)


const datatype = new Concept("Datatype", true, metamodelElement)
property_type.ofType(datatype)


const primitiveType = new Concept("PrimitiveType", false, datatype)


const typedef_constraints = new Reference("constraints", Multiplicity.Single)
typedef_constraints.ofType(primitiveType)

const typedef = new Concept("Typedef", false, datatype)
    .havingFeatures(typedef_constraints)


const containment_specializes = new Reference("specializes", Multiplicity.Optional)

const containment = new Concept("Containment", false, link)
    .havingFeatures(containment_specializes)

containment_specializes.ofType(containment)


export const lioncore = new Metamodel("lioncore")
    .havingElements(
        namespacedEntity,
        namespaceProvider,
        metamodel,
        metamodelElement,
        featuresContainer,
        concept,
        conceptInterface,
        annotation,
        feature,
        link,
        reference,
        property,
        datatype,
        primitiveType,
        typedef,
        containment,
        multiplicity,
        // built-ins:
        booleanDatatype,
        stringDatatype
    )

