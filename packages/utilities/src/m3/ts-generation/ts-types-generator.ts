import {
    allFeaturesOf,
    Annotation,
    builtinClassifiers,
    builtinPrimitives,
    Classifier,
    Concept,
    conceptsOf,
    Datatype,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    DynamicNode,
    Enumeration,
    Feature,
    groupBy,
    inheritsFrom,
    Interface,
    isConcrete,
    Language,
    LanguageEntity,
    Link,
    lioncoreBuiltins,
    mapValues,
    nameOf,
    nameSorted,
    PrimitiveType,
    Property,
    SingleRef,
    unresolved
} from "@lionweb/core"
import {asString, Template, when} from "littoral-templates"
import {indent} from "./textgen.js"
import {Field, tsFromTypeDef, TypeDefModifier} from "./type-def.js"
import {uniquesAmong} from "../../utils/array.js"
import {picker} from "../../utils/object.js"


const fieldForFeature = (feature: Feature) => {
    if (feature instanceof Link) {
        return fieldForLink(feature)
    }
    if (feature instanceof Property) {
        return fieldForProperty(feature)
    }
    return {
        name: feature.name,
        optional: false,
        type: `unknown`
    }
}


const fieldForLink = ({name, type, optional, multiple}: Link): Field =>
    ({
        name,
        optional: optional && !multiple,
        type: `${type === unresolved ? `unknown` : type.name}${multiple ? `[]` : ``}`
    })


const tsTypeFor = (datatype: SingleRef<Datatype>): string => {
    if (datatype instanceof PrimitiveType) {
        switch (datatype) {
            case builtinPrimitives.booleanDatatype: return `boolean`
            case builtinPrimitives.stringDatatype: return `string`
            case builtinPrimitives.integerDatatype: return `number`
            case builtinPrimitives.jsonDatatype: return `unknown`
            default:
                return `string`
        }
    }
    if (datatype instanceof Enumeration) {
        return datatype.name
    }
    return `unknown /* [ERROR] can't compute a TS type for this datatype: ${datatype} */`
}


const fieldForProperty = ({name, type, optional}: Property): Field =>
    ({
        name,
        optional,
        type: tsTypeFor(type)
    })


const isINamed = (entity: LanguageEntity): boolean =>
    entity === builtinClassifiers.inamed


const usesINamedDirectly = (entity: LanguageEntity): boolean => {
    if (entity instanceof Annotation) {
        return entity.implements.some(isINamed)
    }
    if (entity instanceof Concept) {
        return entity.implements.some(isINamed)
    }
    if (entity instanceof Interface) {
        return entity.extends.some(isINamed)
    }
    return false
}


const typeForEnumeration = (enumeration: Enumeration): Template =>
    [
        `enum ${enumeration.name} {`,
        indent(enumeration.literals.map(nameOf).join(`, `)),
        `}`,
        ``
    ]


const typeForPrimitiveType = (datatype: PrimitiveType): Template =>
    [
        `export type ${datatype.name} = ${tsTypeFor(datatype)};`,
        ``
    ]


export enum GenerationOptions {
    assumeSealed
}


/**
 * @return string generated TypeScript source code that contains type definitions that match the given {@link Language language}
 *  in combination with using the {@link DynamicNode} base type and corresponding facades.
 */
export const tsTypesForLanguage = (language: Language, ...generationOptions: GenerationOptions[]) => {

    const fieldsForClassifier = (classifier: Classifier) => {
        const map = mapValues<Feature[], [Feature, Field][]>(
            groupBy(allFeaturesOf(classifier), nameOf),
            (features) => features.map((feature) => ([feature, fieldForFeature(feature)]))
        )
        Object.values(map)
            .filter((fieldsWithOrigin) => fieldsWithOrigin.length > 1)
            .forEach((fieldsWithOrigin) => {
                fieldsWithOrigin.forEach(([feature, field]) => {
                    field.name = `${field.name}_${feature.parent!.name}`
                })
            })
        return Object.values(map)
            .flatMap((fieldsWithOrigin) =>
                fieldsWithOrigin.map(([_, field]) => field)
            )
    }

    const typeForAnnotation = (annotation: Annotation) => {
        const superTypes = inheritsFrom(annotation)

        return tsFromTypeDef({
            modifier: TypeDefModifier.none,
            name: annotation.name,
            mixinNames: superTypes.length === 0 ? [`DynamicNode`] : superTypes.map(nameOf),
            fields: fieldsForClassifier(annotation)
        })
    }

    const typeForConcept = (concept: Concept) => {
        const superTypes = inheritsFrom(concept)
        const subClassifiers =
            concept.abstract
                ? (
                    generationOptions.indexOf(GenerationOptions.assumeSealed) > -1
                        ? conceptsOf(language).filter((entity) => entity.extends === concept)
                        : []
                )
                : [concept]

        return tsFromTypeDef({
            modifier: concept.abstract ? TypeDefModifier.abstract : TypeDefModifier.none,
            name: concept.name,
            mixinNames: superTypes.length === 0 ? [`DynamicNode`] : superTypes.map(nameOf),
            bodyComment: subClassifiers.length > 0 ? `classifier -> ${subClassifiers.map(nameOf).join(` | `)}` : undefined,
            fields: fieldsForClassifier(concept)
        })
    }

    const typeForInterface = (intface: Interface) =>
        tsFromTypeDef({
            modifier: TypeDefModifier.interface,
            name: intface.name,
            mixinNames: intface.extends.length === 0 ? [`DynamicNode`] : intface.extends.map(nameOf),
            fields: fieldsForClassifier(intface)
        })

    const typeForLanguageEntity = (entity: LanguageEntity) => {
        if (entity instanceof Annotation) {
            return typeForAnnotation(entity)
        }
        if (entity instanceof Concept) {
            return typeForConcept(entity)
        }
        if (entity instanceof Enumeration) {
            return typeForEnumeration(entity)
        }
        if (entity instanceof Interface) {
            return typeForInterface(entity)
        }
        if (entity instanceof PrimitiveType) {
            return typeForPrimitiveType(entity)
        }
        return [
            `// unhandled language entity <${entity.constructor.name}>"${entity.name}"`,
            ``
        ]
    }

    const dependenciesOfClassifier = (classifier: Classifier): Classifier[] =>
        [
            ...inheritsFrom(classifier),
            ...allFeaturesOf(classifier)
                .filter((feature) => feature instanceof Link)
                .map((feature) => feature as Link)
                .flatMap(picker("type"))
                .filter((type) => type instanceof Classifier)
                .map((classifier) => classifier as Classifier)
        ]

    const coreImports = [
        ...when(!language.entities.every(usesINamedDirectly))([`DynamicNode`]),
        ...when(language.entities.some(usesINamedDirectly))([`INamed`])
    ]

    const generatedDependencies = uniquesAmong(
        language.entities
            .filter((entity) => entity instanceof Classifier)
            .flatMap((entity) => dependenciesOfClassifier(entity as Classifier))
        )
        .filter((classifier) => classifier.language !== language && classifier.language !== lioncoreBuiltins)
    const importsPerPackage = groupBy(
        generatedDependencies,
        ({language}) => language.name
    )

    const concreteClassifiers = language.entities.filter(isConcrete)

    return asString(
        [
            `// Warning: this file is generated!`,
            `// Modifying it by hand is useless at best, and sabotage at worst.`,
            ``,
            `/*
 * language's metadata:
 *     name:    ${language.name}
 *     version: ${language.version}
 */`,
            ``,
            when(coreImports.length > 0)(`import {${coreImports.join(`, `)}} from "@lionweb/core";`),
            Object.keys(importsPerPackage)
                .sort()
                .map((packageName) => `import {${nameSorted(importsPerPackage[packageName]).map(nameOf).join(", ")}} from "./${packageName}.js";`),
            ``,
            ``,
            nameSorted(language.entities).map(typeForLanguageEntity),
            when(concreteClassifiers.length > 0)([
                ``,
                `/** sum type of all types for all concrete classifiers of ${language.name}: */`,
                `export type Nodes = ${nameSorted(concreteClassifiers).map(nameOf).join(` | `)};`,
                ``
            ])
        ]
    )
}

