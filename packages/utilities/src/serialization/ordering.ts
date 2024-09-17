import {
    MetaPointer,
    SerializationChunk,
    SerializedContainment,
    SerializedLanguageReference,
    SerializedNode,
    SerializedProperty,
    SerializedReference,
    SerializedReferenceTarget
} from "@lionweb/core"


const orderedMetaPointer = ({language, version, key}: MetaPointer): MetaPointer =>
    ({
        language,
        version,
        key
    })

const orderedSerializedLanguageReference = ({key, version}: SerializedLanguageReference): SerializedLanguageReference =>
    ({
        key,
        version
    })

const orderedSerializedReferenceTarget = ({reference, resolveInfo}: SerializedReferenceTarget): SerializedReferenceTarget =>
    ({
        resolveInfo,
        reference
    })

const orderedSerializedProperty = ({property, value}: SerializedProperty): SerializedProperty =>
    ({
        property: orderedMetaPointer(property),
        value
    })

const orderedSerializedContainment = ({containment, children}: SerializedContainment): SerializedContainment =>
    ({
        containment: orderedMetaPointer(containment),
        children    // TODO  ensure [] if empty
    })

const orderedSerializedReference = ({reference, targets}: SerializedReference): SerializedReference =>
    ({
        reference: orderedMetaPointer(reference),
        targets: targets.map(orderedSerializedReferenceTarget)    // TODO  ensure [] if empty
    })

const orderedSerializedNode = ({id, classifier, properties, containments, references, annotations, parent}: SerializedNode): SerializedNode =>
    ({
        id,
        classifier: orderedMetaPointer(classifier),
        properties: properties.map(orderedSerializedProperty),
        containments: containments.map(orderedSerializedContainment),
        references: references.map(orderedSerializedReference),
        annotations,    // TODO  ensure [] if empty
        parent
    })


const orderedSerializationChunk = ({serializationFormatVersion, languages, nodes}: SerializationChunk): SerializationChunk =>
    ({
        serializationFormatVersion,
        languages: languages.map(orderedSerializedLanguageReference),
        nodes: nodes.map(orderedSerializedNode)
    })


export {
    orderedMetaPointer,
    orderedSerializationChunk,
    orderedSerializedLanguageReference,
    orderedSerializedProperty,
    orderedSerializedReferenceTarget
}

