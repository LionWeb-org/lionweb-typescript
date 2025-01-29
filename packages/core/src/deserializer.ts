import {Id, Node} from "./types.js"
import {InstantiationFacade} from "./facade.js"
import {defaultSimplisticHandler, SimplisticHandler} from "./handler.js"
import {unresolved} from "./references.js"
import {currentSerializationFormatVersion, SerializationChunk, SerializedNode} from "./serialization.js"
import {MemoisingSymbolTable} from "./symbol-table.js"
import {DefaultPrimitiveTypeDeserializer} from "./m3/builtins.js"
import {Classifier, Containment, Enumeration, Language, PrimitiveType, Property, Reference} from "./m3/types.js"
import {allFeaturesOf} from "./m3/functions.js"
import {byIdMap, groupBy} from "./utils/map-helpers.js"


export interface PrimitiveTypeDeserializer {
    deserializeValue(value: string | undefined, property: Property): unknown | undefined
}


/**
 * @return a deserialization of a {@link SerializationChunk}
 *
 * @param serializationChunk - a {@link SerializedModel model} from its LionWeb serialization JSON format
 * @param instantiationFacade - a {@link InstantiationFacade} that is used to instantiate nodes and set values on them
 * @param languages - a {@link Language language} that the serialized model is expected to conform to
 * @param dependentNodes - a collection of nodes from dependent models against which all references in the serialized model are supposed to resolve against
 * @param primitiveTypeDeserializer - a deserializer for values of primitive types (by default a {@link DefaultPrimitiveTypeDeserializer})
 * @param problemHandler - a handler for reporting problems (by default a {@link defaultSimplisticHandler})
 */
export const deserializeSerializationChunk = <NT extends Node>(
    serializationChunk: SerializationChunk,
    instantiationFacade: InstantiationFacade<NT>,
    languages: Language[],
    // TODO  facades <--> languages, so it's weird that it looks split up like this
    dependentNodes: Node[],
    // TODO (#13)  see if you can turn this into [nodes: Node[], instantiationFacade: InstantiationFacade<Node>][] after all
    primitiveTypeDeserializer: PrimitiveTypeDeserializer = new DefaultPrimitiveTypeDeserializer(),
    problemHandler: SimplisticHandler = defaultSimplisticHandler
): NT[] => {

    if (serializationChunk.serializationFormatVersion !== currentSerializationFormatVersion) {
        problemHandler.reportProblem(`can't deserialize from serialization format other than version "${currentSerializationFormatVersion}" - assuming that version`)
    }

    const symbolTable = new MemoisingSymbolTable(languages)

    const { nodes: serializedNodes } = serializationChunk

    const serializedNodeById = byIdMap(serializedNodes)

    const deserializedNodeById: { [id: Id]: NT } = {}

    /**
     * Instantiates a {@link Node} from the given {@link SerializedNode},
     * and stores it under its ID so references to it can be resolved.
     * For every serialized node, only one instance will ever be constructed (through memoisation).
     */
    const instantiateMemoised = (serNode: SerializedNode, parent?: NT): (NT | null) => {
        if (serNode.id in deserializedNodeById) {
            return deserializedNodeById[serNode.id]
        }
        const node = instantiate(serNode, parent)
        if (node !== null) {
            deserializedNodeById[node.id] = node
        }
        return node
    }

    type ReferenceToInstall = [node: NT, feature: Reference, refId: Id]
    const referencesToInstall: ReferenceToInstall[] = []

    const tryInstantiate = (parent: NT | undefined, classifier: Classifier, id: Id, propertySettings: { [propertyKey: string]: unknown }): (NT | null) => {
        try {
            return instantiationFacade.nodeFor(parent, classifier, id, propertySettings)
        } catch (e: unknown) {
            problemHandler.reportProblem(`error occurred during instantiation of a node for classifier ${classifier.name} with meta-pointer (${classifier.language.key}, ${classifier.language.version}, ${classifier.key}); reason:`);
            problemHandler.reportProblem((e as Error).toString())
            return null
        }
    }

    /**
     * Instantiates a {@link Node} from its {@link SerializedNode serialization}.
     */
    const instantiate = ({id, classifier: classifierMetaPointer, properties, containments, references, annotations}: SerializedNode, parent?: NT): (NT | null) => {

        const classifier = symbolTable.entityMatching(classifierMetaPointer)

        if (classifier === undefined || !(classifier instanceof Classifier)) {
            problemHandler.reportProblem(`can't deserialize node with id=${id}: can't find the classifier with key ${classifierMetaPointer.key} in language (${classifierMetaPointer.language}, ${classifierMetaPointer.version})`)
            return null
        }

        const allFeatures = allFeaturesOf(classifier)

        const propertySettings: { [propertyKey: string]: unknown } = {}

        const serializedPropertiesPerKey =
            properties === undefined ? {} : groupBy(properties, (sp) => sp.property.key)    // (this assumes no duplicate keys among properties!)
        if (properties !== undefined) {
            allFeatures
                .filter((feature) => feature instanceof Property)
                .map((feature) => feature as Property)
                .forEach((property) => {
                    if (property.key in serializedPropertiesPerKey) {
                        const value = serializedPropertiesPerKey[property.key][0].value
                        if (property.type instanceof PrimitiveType) {
                            propertySettings[property.key] = value === null ? undefined : primitiveTypeDeserializer.deserializeValue(value, property as Property)
                            return
                        }
                        if (property.type instanceof Enumeration) {
                            const literal = property.type.literals.find((literal) => literal.key === value)
                            if (literal !== undefined) {
                                propertySettings[property.key] = instantiationFacade.encodingOf(literal)
                            }
                            return
                        }
                        // (property is not handled, because neither a primitive type nor of enumeration type)
                    }
                })
        }

        const node = tryInstantiate(parent, classifier, id, propertySettings)
        if (node === null) {
            return null
        }

        const serializedContainmentsPerKey =
            containments === undefined ? {} : groupBy(containments, (sp) => sp.containment.key)    // (this assumes no duplicate keys among containments!)
        const serializedReferencesPerKey =
            references === undefined ? {} : groupBy(references, (sp) => sp.reference.key)    // (this assumes no duplicate keys among references!)

        allFeatures
            .forEach((feature) => {
                if (feature instanceof Property && properties !== undefined && feature.key in serializedPropertiesPerKey) {
                    instantiationFacade.setFeatureValue(node, feature, propertySettings[feature.key])
                } else if (feature instanceof Containment && containments !== undefined && feature.key in serializedContainmentsPerKey) {
                    const childIds = serializedContainmentsPerKey[feature.key].flatMap((serChildren) => serChildren.children) as Id[]
                    if (feature.multiple) {
                        childIds
                            .forEach((childId) => {
                                if (childId in serializedNodeById) {
                                    instantiationFacade.setFeatureValue(node, feature, instantiateMemoised(serializedNodeById[childId], node))
                                }
                            })
                    } else {
                        if (childIds.length > 0) {
                            // just set the 1st one:
                            const firstChildId = childIds[0]
                            if (firstChildId in serializedNodeById) {
                                instantiationFacade.setFeatureValue(node, feature, instantiateMemoised(serializedNodeById[firstChildId], node))
                            }
                        }
                    }
                } else if (feature instanceof Reference && references !== undefined && feature.key in serializedReferencesPerKey) {
                    const serRefs = (serializedReferencesPerKey[feature.key] ?? []).flatMap(
                        (serReferences) => serReferences.targets.map(
                            (t) => t.reference)
                    )
                    referencesToInstall.push(...(
                        (
                            serRefs
                                .filter((serRef) => typeof serRef === "string") as Id[]
                        )
                            .map((refId) => [node, feature, refId] as ReferenceToInstall)
                    ))
                }
            })

        node.annotations = annotations
            .filter((annotationId) => annotationId in serializedNodeById)
            .map((annotationId) => instantiateMemoised(serializedNodeById[annotationId]))
            .filter((annotationOrNull) => annotationOrNull !== null)
            .map((annotation) => annotation!)

        return node

    }

    const rootLikeNodes = serializedNodes
        .filter(({ parent }) => parent === null || !(parent in serializedNodeById))
        .map((serializedNode) => instantiateMemoised(serializedNode))
        .filter((nodeOrNull) => nodeOrNull !== null)
        .map((node) => node!)

    const dependentNodesById = byIdMap(dependentNodes)

    referencesToInstall.forEach(([node, reference, refId]) => {
        const target = deserializedNodeById[refId] ?? dependentNodesById[refId]
        const value = (() => {
            if (target === undefined) {
                const metaTypeMessage = "concept" in node ? ` and (meta-)type ${node.concept}` : ""
                problemHandler.reportProblem(`couldn't resolve the target with id=${refId} of a "${reference.name}" reference on the node with id=${node.id}${metaTypeMessage}`)
                return unresolved
            }
            return target
        })()
        instantiationFacade.setFeatureValue(node, reference, value)
    })

    return rootLikeNodes
}


/**
 * Alias for {@link deserializeSerializationChunk}.
 */
export const deserializeChunk = deserializeSerializationChunk

