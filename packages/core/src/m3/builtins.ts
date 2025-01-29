import {LanguageFactory} from "./factory.js"
import {Classifier, Concept, Datatype, lioncoreBuiltinsKey, Property} from "./types.js"
import {StringsMapper} from "../utils/string-mapping.js"
import {currentReleaseVersion} from "../version.js"
import {PrimitiveTypeDeserializer} from "../deserializer.js"
import {PrimitiveTypeSerializer} from "../serializer.js"


const lioncoreBuiltinsIdAndKeyGenerator: StringsMapper =
    (...names) => [lioncoreBuiltinsKey, ...names.slice(1)].join("-")


const factory = new LanguageFactory(
    "LionCore_builtins",
    currentReleaseVersion,
    lioncoreBuiltinsIdAndKeyGenerator,
    lioncoreBuiltinsIdAndKeyGenerator
)
/*
 * ID == key: `LionCore-builtins-${qualified name _without_ "LionCore-builtins", dash-separated}`
 */


/**
 * Definition of a LionCore language that serves as a standard library of built-in primitive types.
 */
const lioncoreBuiltins = factory.language


const stringDatatype = factory.primitiveType("String")
const booleanDatatype = factory.primitiveType("Boolean")
const integerDatatype = factory.primitiveType("Integer")
const jsonDatatype = factory.primitiveType("JSON")


const node = factory.concept("Node", true)


const isBuiltinNodeConcept = (classifier: Classifier) =>
       classifier instanceof Concept
    && classifier.language.key === lioncoreBuiltinsKey
    && classifier.language.version === currentReleaseVersion
    && classifier.key === builtinClassifiers.node.key
    && (classifier as Concept).abstract


const inamed = factory.interface("INamed")

const inamed_name = factory.property(inamed, "name")
    .ofType(stringDatatype)


type BuiltinPrimitive = string | boolean | number | Record<string, unknown> | Array<unknown>
type PrimitiveTypeValue = BuiltinPrimitive | unknown
type SpecificPrimitiveTypeDeserializer = (value: string) => PrimitiveTypeValue
type SpecificPrimitiveTypeSerializer = (value: unknown) => string

const builtinPrimitives = {
    stringDatatype,
    booleanDatatype,
    integerDatatype,
    jsonDatatype
}

const builtinClassifiers = {
    node,
    inamed
}

const builtinFeatures = {
    inamed_name
}


/**
 * Determines whether two datatypes should be structurally equal based on equality of: meta type, key, and language's key.
 */
const shouldBeIdentical = (left: Datatype, right: Datatype): boolean =>
       left.key === right.key
    && left.language.key === right.language.key
    && left.metaType() === right.metaType()

abstract class DatatypeRegister<T> {

    private map = new Map<Datatype, T>()

    public register(datatype: Datatype, t: T) {
        this.map.set(datatype, t)
    }

    protected byType(targetDatatype: Datatype): T | undefined {
        for (const entry of this.map.entries()) {
            const [datatype, t] = entry
            if (shouldBeIdentical(targetDatatype, datatype)) {
                return t
            }
        }
        return undefined
    }

}


export class DefaultPrimitiveTypeDeserializer extends DatatypeRegister<SpecificPrimitiveTypeDeserializer> implements PrimitiveTypeDeserializer {

    constructor() {
        super()
        this.register(stringDatatype, (value) => value)
        this.register(booleanDatatype, (value) => JSON.parse(value))
        this.register(integerDatatype, (value) => Number(value))
        this.register(jsonDatatype, (value) => JSON.parse(value as string))
    }

    deserializeValue(value: string | undefined, property: Property): PrimitiveTypeValue | undefined {
        if (value === undefined) {
            if (property.optional) {
                return undefined
            }
            throw new Error(`can't deserialize undefined as the value of a required property`)
        }
        const { type } = property
        if (type == null) {
            throw new Error(`cant't deserialize a property with unspecified type`)
        }
        const specificDeserializer = this.byType(type)
        if (specificDeserializer != undefined) {
            return specificDeserializer(value)
        } else {
            throw new Error(`can't deserialize value of type "${type!.name}": ${value}`)
        }
    }
}

export class DefaultPrimitiveTypeSerializer extends DatatypeRegister<SpecificPrimitiveTypeSerializer> implements PrimitiveTypeSerializer {

    constructor() {
        super()
        this.register(stringDatatype, (value) => value as string)
        this.register(booleanDatatype, (value) => `${value as boolean}`)
        this.register(integerDatatype, (value) => `${value as number}`)
        this.register(jsonDatatype, (value) => JSON.stringify(value, null))
    }

    serializeValue(value: unknown | undefined, property: Property): string | undefined {
        if (value === undefined) {
            if (property.optional) {
                return undefined
            }
            throw new Error(`can't serialize undefined as the value of a required property`)
        }
        const { type } = property
        if (type == null) {
            throw new Error(`cant't serialize a property with unspecified type`)
        }
        const specificSerializer = this.byType(type)
        if (specificSerializer != undefined) {
            return specificSerializer(value)
        } else {
            throw new Error(`can't serialize value of type "${type!.name}": ${value}`)
        }
    }
}

export type {
    BuiltinPrimitive
}

export {
    builtinPrimitives,
    builtinClassifiers,
    builtinFeatures,
    isBuiltinNodeConcept,
    lioncoreBuiltins,
    shouldBeIdentical
}

