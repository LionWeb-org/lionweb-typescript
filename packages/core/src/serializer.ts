import {ExtractionFacade} from "./facade.js"
import {currentSerializationFormatVersion, MetaPointer, SerializationChunk, SerializedNode} from "./serialization.js"
import {asIds} from "./functions.js"
import {Node} from "./types.js"
import {DefaultPrimitiveTypeSerializer} from "./m3/builtins.js"
import {allFeaturesOf} from "./m3/functions.js"
import {
    Containment,
    Enumeration,
    Feature,
    Language,
    PrimitiveType,
    Property,
    Reference,
    simpleNameDeducer
} from "./m3/types.js"
import {asArray} from "./utils/array-helpers.js"


export interface PrimitiveTypeSerializer {
    serializeValue(value: unknown, property: Property): string | undefined
}

const isPrimitiveTypeSerializer = (value: unknown): value is PrimitiveTypeSerializer =>
       typeof value === "object"
    && value !== null
    && "serializeValue" in value
    && typeof value.serializeValue === "function"


/**
 * Type to provide options to the serializer.
 */
export type SerializationOptions = Partial<{
    /**
     * Determines whether empty feature values are explicitly serialized or skipped during serialization.
     * (The specification states that empty feature values SHOULD be serialized, but not that they MUST be.)
     * Default = true, meaning that empty feature values are *not* skipped.
     */
    serializeEmptyFeatures: boolean

    primitiveTypeSerializer: PrimitiveTypeSerializer
}>


/**
 * @return the {@link MetaPointer} for the given {@link Feature}.
 */
export const metaPointerFor = (feature: Feature): MetaPointer => {
    const {language} = feature.classifier
    return {
        language: language.key,
        version: language.version,
        key: feature.key
    }
}


/**
 * @return a {@link SerializationChunk} of the given model (i.e., an array of {@link Node nodes} - the first argument) to the LionWeb serialization JSON format.
 */
export const serializeNodes = <NT extends Node>(
    nodes: NT[],
    extractionFacade: ExtractionFacade<NT>,
    primitiveTypeSerializerOrOptions?: PrimitiveTypeSerializer | SerializationOptions
): SerializationChunk /* <=> JSON */ => {
    const primitiveTypeSerializer = (
        isPrimitiveTypeSerializer(primitiveTypeSerializerOrOptions)
            ? primitiveTypeSerializerOrOptions
            : primitiveTypeSerializerOrOptions?.primitiveTypeSerializer
    ) ?? new DefaultPrimitiveTypeSerializer()
    const serializeEmptyFeatures = isPrimitiveTypeSerializer(primitiveTypeSerializerOrOptions)
        ? true
        : (primitiveTypeSerializerOrOptions?.serializeEmptyFeatures ?? true)

    const serializedNodes: SerializedNode[] = []  // keep nodes as much as possible "in order"
    const ids: { [id: string]: boolean } = {}   // maintain a map to keep track of IDs of nodes that have been serialized
    const languagesUsed: Language[] = []
    const registerLanguageUsed = (language: Language) => {
        if (!languagesUsed.some((languageUsed) => language.equals(languageUsed))) {
            languagesUsed.push(language)
        }
    }

    const visit = (node: NT, parent?: NT) => {
        if (ids[node.id]) {
            return
        }

        const classifier = extractionFacade.classifierOf(node)
        const language = classifier.language
        registerLanguageUsed(language)
        const serializedNode: SerializedNode = {
            id: node.id,
            classifier: classifier.metaPointer(),
            properties: [],
            containments: [],
            references: [],
            annotations: [],
            parent: null
        }
        serializedNodes.push(serializedNode)
        ids[node.id] = true
        allFeaturesOf(classifier).forEach((feature) => {
            const value = extractionFacade.getFeatureValue(node, feature)
            const featureLanguage = feature.classifier.language
            registerLanguageUsed(featureLanguage)
            const featureMetaPointer = metaPointerFor(feature)
            if (feature instanceof Property) {
                if (value === undefined && !serializeEmptyFeatures) {
                    // for immediate backward compatibility: skip empty property values regardless of options?.skipEmptyValues
                    return
                }
                const encodedValue = (() => {
                    // (could also just inspect type of value:)
                    if (feature.type instanceof PrimitiveType) {
                        return primitiveTypeSerializer.serializeValue(value, feature)
                    }
                    if (feature.type instanceof Enumeration) {
                        return extractionFacade.enumerationLiteralFrom(value, feature.type)?.key
                    }
                    return undefined
                })()
                serializedNode.properties.push({
                    property: featureMetaPointer,
                    value: (encodedValue as string) ?? null // (undefined -> null)
                })
                return
            }
            if (feature instanceof Containment) {
                const children = asArray(value) as (NT | null)[]
                if (children.length === 0 && !serializeEmptyFeatures) {
                    return
                }
                serializedNode.containments.push({
                    containment: featureMetaPointer,
                    children: asIds(children)
                        .filter((childId) => childId !== null)
                        .map((childId) => childId as string)
                })
                children.forEach((childOrNull) => {
                    if (childOrNull !== null) {
                        visit(childOrNull, node);
                    }
                })
                return
            }
            if (feature instanceof Reference) {
                // Note: value can be null === typeof unresolved, e.g. on an unset (or previously unresolved) single-valued reference
                const targets = asArray(value) as (NT | null)[]
                if (targets.length === 0 && !serializeEmptyFeatures) {
                    return
                }
                serializedNode.references.push({
                    reference: featureMetaPointer,
                    targets: targets
                        .filter((tOrNull) => tOrNull !== null)  // (skip "non-connected" targets)
                        .map((t) => t as NT)
                        .map((t) => ({
                            resolveInfo: (extractionFacade.resolveInfoFor
                                ? extractionFacade.resolveInfoFor(t)
                                : simpleNameDeducer(t)) ?? null,
                            reference: t.id
                        })
                    )
                })
                return
            }
        })

        const annotations = asArray(node.annotations) as NT[]   // assumes that annotations also all are of type NT (which is not unreasonable)
        serializedNode.annotations = annotations.map((annotation) => annotation.id)
        annotations.forEach((annotation) => visit(annotation, node))

        serializedNode.parent = parent?.id ?? null  // (undefined -> null)
    }

    nodes.forEach((node) => visit(node, undefined))

    return {
        serializationFormatVersion: currentSerializationFormatVersion,
        languages: languagesUsed
            .map(({key, version}) => ({ key, version })),
        nodes: serializedNodes
    }
}

