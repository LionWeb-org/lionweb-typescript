import {Node} from "./types.js"
import {Classifier, Enumeration, EnumerationLiteral, Feature, Link} from "./m3/types.js"
import {flatMapNonCyclingFollowing, trivialFlatMapper} from "./utils/recursion.js"
import {allFeaturesOf, isContainment} from "./m3/functions.js"


/**
 * Type def. for functions that deduce the {@link Classifier classifier} of a given {@link Node node}.
 */
type ClassifierDeducer<NT extends Node> = (node: NT) => Classifier

/**
 * Type def. for functions that deduce the string value of the `resolveInfo` field of a
 * {@link SerializedReferenceTarget serialized reference target}, or  {@code undefined}
 * to indicate that no `resolveInfo` could be derived.
 */
type ResolveInfoDeducer<NT extends Node> = (node: NT) => string | undefined


/**
 * Two interfaces that defines façades for in-memory models.
 * Instances/implementations of this interface parametrize generic (de-)serialization.
 * Implementations of these interfaces {w|c}ould be:
 *  - specific to Lioncore (so to match m3/types.ts)
 *  - generic to deserialize into @link DynamicNode}
 */


interface ExtractionFacade<NT extends Node> {

    /**
     * @return The {@link Concept concept} of the given node
     */
    classifierOf: ClassifierDeducer<NT>

    /**
     * @return The value of the given {@link Feature feature} on the given node.
     */
    getFeatureValue: (node: NT, feature: Feature) => unknown
// TODO  split to getPropertyValue, &c.?

    /**
     * @return The {@link EnumerationLiteral} corresponding to
     * the given {@link Enumeration} and the runtime encoding of a literal of it,
     */
    enumerationLiteralFrom: (encoding: unknown, enumeration: Enumeration) => EnumerationLiteral | null

    /**
     * @return The string value of the `resolveInfo` field of a {@link SerializedReferenceTarget serialized reference target},
     * or {@code undefined} to indicate that no `resolveInfo` could be derived.
     */
    resolveInfoFor?: ResolveInfoDeducer<NT>

}

interface InstantiationFacade<NT extends Node> {

    /**
     * @return An instance of the given concept, also given its parent (or {@link undefined} for root nodes),
     * its ID and the values of the node's properties ("settings").
     * (The latter may be required as arguments for the constructor of a class, whose instances represent nodes.)
     */
    nodeFor: (parent: NT | undefined, classifier: Classifier, id: string, propertySettings: { [propertyKey: string]: unknown }) => NT
// TODO  this prohibits multiple properties with the same key but different language => use a variant of SerializedProperty[] with the value already deserialized

    /**
     * Sets the *single* given value of the indicated {@link Feature} on the given node.
     * This means adding it in case the feature is multi-valued, meaning it is a {@link Link} with {@code multiple = true}.
     */
    setFeatureValue: (node: NT, feature: Feature, value: unknown) => void
// TODO  split to setPropertyValue, &c.?

    /**
     * @return The runtime encoding of the given {@link EnumerationLiteral}.
     */
    encodingOf: (literal: EnumerationLiteral) => unknown

}

/**
 * Type def. for functions that extract {@link Node nodes} from a given one.
 */
type NodesExtractor<NT extends Node> = (node: NT) => NT[]

/**
 * @return A function that extracts the children from a given node.
 */
const childrenExtractorUsing = <NT extends Node>(extractionFacade: ExtractionFacade<NT>): NodesExtractor<NT> =>
    (node: NT): NT[] =>
        allFeaturesOf(extractionFacade.classifierOf(node))
            .filter(isContainment)
            .flatMap((containment) => extractionFacade.getFeatureValue(node, containment) as NT[])
// FIXME  there's NO guarantee about the result of extractionFacade.getFeatureValue(node, containment) !!!
// FIXME  this misses all the annotations !!!

/**
 * @return a function that extracts *all* nodes from a given start node - usually a root node.
 */
const nodesExtractorUsing = <NT extends Node>(extractionFacade: ExtractionFacade<NT>): NodesExtractor<NT> =>
    flatMapNonCyclingFollowing(trivialFlatMapper, childrenExtractorUsing<NT>(extractionFacade))


type SettingsUpdater = (settings: Record<string, unknown>, feature: Feature, value: unknown) => void

const settingsUpdater = (metaKey: string): SettingsUpdater =>
    (settings: Record<string, unknown>, feature: Feature, value: unknown): void => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        const key = (feature as any)[metaKey] as string
        if (feature instanceof Link && feature.multiple) {
            if (!Array.isArray(settings[key])) {
                settings[key] = []
            }
            (settings[key] as unknown[]).push(value)
        } else {
            settings[key] = value
        }
    }


/**
 * Updates the value of the given {@link Feature feature} on the given "settings" object
 * (either a {@link Node node} or a sub object of it), using the feature's *name*.
 */
const updateSettingsNameBased: SettingsUpdater = settingsUpdater("name")

/**
 * Updates the value of the given {@link Feature feature} on the given "settings" object
 * (either a {@link Node node} or a sub object of it), using the feature's *key*.
 */
const updateSettingsKeyBased = settingsUpdater("key")

export type {
    ClassifierDeducer,
    ExtractionFacade,
    InstantiationFacade,
    NodesExtractor,
    ResolveInfoDeducer
}

export {
    childrenExtractorUsing,
    nodesExtractorUsing,
    updateSettingsKeyBased,
    updateSettingsNameBased
}

