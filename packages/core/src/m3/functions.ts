/**
 * Various functions on M3 models.
 */


import {
    Annotation,
    Classifier,
    Concept,
    Containment,
    Datatype,
    Enumeration,
    Feature,
    IKeyed,
    IMetaTyped,
    INamed,
    Interface,
    isINamed,
    Language,
    LanguageEntity,
    Link,
    M3Concept,
    Property,
    Reference
} from "./types.js"
import {isRef, unresolved} from "../references.js"
import {sortByStringKey} from "../utils/sorting.js"
import {cycleWith} from "../utils/cycles.js"
import {flatMapNonCyclingFollowing} from "../utils/recursion.js"
import {Id, Node} from "../types.js"
import {ClassifierDeducer} from "../facade.js"
import {containmentChain} from "../functions.js"


/**
 * @return The type of the given {@link Feature}
 */
const type = (feature: Feature): Classifier | Datatype | typeof unresolved =>
    (feature as (Link | Property)).type


const isProperty = (feature: Feature): feature is Property =>
    feature instanceof Property

const isContainment = (feature: Feature): feature is Containment =>
    feature instanceof Containment

const isReference = (feature: Feature): feature is Reference =>
    feature instanceof Reference

const isMultiple = (feature: Feature): feature is Link =>
    feature instanceof Link && feature.multiple


/**
 * The (names of the) metatypes of a feature.
 */
type FeatureMetaType =
    | "Containment"
    | "Property"
    | "Reference"

/**
 * @return the (name of the) metatype of the given {@link Feature feature}.
 */
const featureMetaType = (feature: Feature): FeatureMetaType => {
    if (feature instanceof Containment) {
        return "Containment"
    }
    if (feature instanceof Property) {
        return "Property"
    }
    if (feature instanceof Reference) {
        return "Reference"
    }
    throw new Error(`unhandled Feature sub type ${feature.constructor.name}`)
}


/**
 * Determines whether a {@link Feature feature} is "relational",
 * i.e. it's a {@link Link containment or reference}.
 */
const isRelational = (feature: Feature): feature is Link =>
    feature instanceof Link

/**
 * @return the relations among the given {@link Feature features}.
 */
const relations = (features: Feature[]): Link[] =>
    features.filter(isRelational)

/**
 * @return the non-relations among the given {@link Feature features}.
 */
const nonRelationalFeatures = (features: Feature[]): Feature[] =>
    features.filter((feature) => !isRelational(feature))


/**
 * @return the relations of the given {@link LanguageEntity language element}.
 */
const relationsOf = (element: LanguageEntity): Link[] =>
    element instanceof Classifier
        ? relations(element.features)
        : []


/**
 * @return The "things", i.e. {@link M3Concept}s, directly contained by the given "thing".
 *  These can be:
 *  {@link LanguageEntity language entities}, {@link Feature features}, and {@link EnumerationLiteral enumeration literals}
 *  (and all their sub types).
 */
const directlyContaineds = (thing: M3Concept): M3Concept[] => {
    if (thing instanceof Language) {
        return thing.entities
    }
    if (thing instanceof Classifier) {
        return thing.features as M3Concept[]    // (cast is necessary because of presence of Feature#classifier getter...?)
    }
    if (thing instanceof Enumeration) {
        return thing.literals
    }
    return []
}


/**
 * @return All {@link M3Concept nodes} contained in this {@link Language language},
 * including the language itself.
 */
const allContaineds = (language: Language): M3Concept[] =>
    [
        language,
        ...directlyContaineds(language),
        ...directlyContaineds(language).flatMap(directlyContaineds)
    ]


/**
 * Performs a depth-first tree traversal of a language, "flatMapping" the `map` function on every node.
 * It avoids visiting nodes twice (to avoid potential infinite loops), but doesn't report cycles.
 */
const flatMap = <T>(language: Language, map: (t: M3Concept) => T[]): T[] =>
    flatMapNonCyclingFollowing(map, directlyContaineds)(language)


/**
 * @return string the name of the given {@link INamed named thing}.
 */
const nameOf = <T extends INamed>({name}: T): string =>
    name


/**
 * @return the given named things sorted by name
 */
export const nameSorted = <T extends INamed>(ts: T[]): T[] =>
    sortByStringKey(ts, nameOf)


/**
 * @return the concatenation of the names of the given nodes using the given separator.
 */
const concatenateNamesOf = (separator: string, nodes: M3Concept[]): string =>
    nodes
        .filter(isINamed)
        .map(nameOf)
        .join(separator)
    // !! slight overkill: every node in an M2 is an M3Concept, so IKeyed and INamed

/**
 * @return the qualified name of the given {@link INamed named thing}.
 */
const qualifiedNameOf = <T extends INamed & Node>(node: T, separator = "."): string =>
    concatenateNamesOf(separator, containmentChain(node).reverse() as M3Concept[])


/**
 * @return the {@link INamed named things} in this {@link Language language}
 *  (excluding the language itself)
 */
const namedsOf = (language: Language): M3Concept[] =>
    allContaineds(language).filter(isINamed)


/**
 * @return the key of the given {@link INamed named thing}.
 */
const keyOf = <T extends IKeyed>({key}: T): string =>
    key


/**
 * Sorts the given {@link LanguageEntity language entities} by name.
 */
const entitiesSortedByName = (entities: LanguageEntity[]) =>
    sortByStringKey(entities, nameOf)


type ConcreteClassifier = Concept | Annotation


/**
 * Determines whether the given {@link LanguageEntity metamodel element} is
 * *concrete*, i.e. is instantiable.
 */
const isConcrete = (thing: LanguageEntity): thing is ConcreteClassifier =>
    (thing instanceof Concept && !thing.abstract) || (thing instanceof Annotation)

const inheritsFrom = (classifier: Classifier): Classifier[] => {
    if (classifier instanceof Concept || classifier instanceof Annotation) {
        return [
            ...(
                isRef(classifier.extends)
                    ? [classifier.extends as Classifier]
                    : []
            ),
            ...classifier.implements
        ]
    }
    if (classifier instanceof Interface) {
        return classifier.extends
    }
    throw new Error(`classifier type ${typeof classifier} not handled`)
}

/**
 * @return an array that's either an inheritance cycle, or empty (meaning: no inheritance cycle).
 */
const inheritedCycleWith = (classifier: Classifier) =>
    cycleWith(classifier, inheritsFrom)


/**
 * @return *all* super types (through `extends` or `implements`) of the given {@link Classifier classifier}.
 */
const allSuperTypesOf = (classifier: Classifier): Classifier[] =>
    flatMapNonCyclingFollowing(inheritsFrom, inheritsFrom)(classifier)


/**
 * @return *all* {@link Feature features} of the given {@link Classifier classifier},
 * including the inherited ones.
 */
const allFeaturesOf = (classifier: Classifier): Feature[] =>
    flatMapNonCyclingFollowing((ci) => ci.features, inheritsFrom)(classifier)


/**
 * Determines whether the given {@link LanguageEntity language element} is an {@link Enumeration enumeration}.
 */
const isEnumeration = (element: LanguageEntity): element is Enumeration =>
    element instanceof Enumeration


/**
 * @return a function that looks up a classifier from the given {@link Language language} by its ID.
 */
const idBasedClassifierDeducerFor = (language: Language) =>
    (id: Id) =>
        language.entities.find((element) => element instanceof Classifier && element.id === id) as Classifier

/**
 * @return a function that looks up a classifier from the given {@link Language language} by its name.
 */
const nameBasedClassifierDeducerFor = (language: Language) =>
    (name: string) =>
        language.entities.find((element) => element instanceof Classifier && element.name === name) as Classifier


/**
 * @return a {@link ClassifierDeducer classifier deducer} that deduces the classifier of nodes by looking up
 * the classifier in the given {@link Language language} by matching the node object's class name to classifiers' names.
 * **Note** that this is not reliable when using bundlers who might minimize class names, and such.
 */
const classBasedClassifierDeducerFor = <NT extends Node>(language: Language): ClassifierDeducer<NT> =>
    (node: NT) => nameBasedClassifierDeducerFor(language)(node.constructor.name)


/**
 * @return a {@link ClassifierDeducer classifier deducer} that deduces the classifier of nodes that implement {@link IMetaTyped}
 * by looking up the classifier in the given {@link Language language} by matching the result of {@link IMetaTyped#metaType}
 * to classifiers' names.
 */
const metaTypedBasedClassifierDeducerFor = <NT extends Node & IMetaTyped>(language: Language): ClassifierDeducer<NT> =>
    (node: NT) => nameBasedClassifierDeducerFor(language)(node.metaType())


/**
 * @return all {@link Concept concepts} defined in the given {@link Language language}.
 */
const conceptsOf = (language: Language): Concept[] =>
    language.entities.filter((entity) => entity instanceof Concept) as Concept[]


const isInstantiableClassifier = (entity: LanguageEntity): boolean =>
       entity instanceof Annotation
    || (entity instanceof Concept && !entity.abstract)
    // leaves out Interface and Concept { abstract: true }

/**
 * @return an array of all instantiable {@link Classifier classifiers} of the given {@link Language language}.
 */
const instantiableClassifiersOf = (language: Language): Classifier[] =>
    language.entities.filter(isInstantiableClassifier) as Classifier[]


export {
    allContaineds,
    allFeaturesOf,
    allSuperTypesOf,
    classBasedClassifierDeducerFor,
    concatenateNamesOf,
    conceptsOf,
    containmentChain,
    directlyContaineds,
    entitiesSortedByName,
    featureMetaType,
    flatMap,
    idBasedClassifierDeducerFor,
    inheritedCycleWith,
    inheritsFrom,
    instantiableClassifiersOf,
    isConcrete,
    isContainment,
    isEnumeration,
    isMultiple,
    isProperty,
    isReference,
    keyOf,
    metaTypedBasedClassifierDeducerFor,
    nameBasedClassifierDeducerFor,
    nameOf,
    namedsOf,
    nonRelationalFeatures,
    relations,
    relationsOf,
    type,
    qualifiedNameOf
}

export type {
    FeatureMetaType
}

