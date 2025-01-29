import {
    Annotation,
    Classifier,
    Concept,
    Containment,
    Enumeration,
    EnumerationLiteral,
    Interface,
    Language,
    PrimitiveType,
    Property,
    Reference
} from "./types.js"
import {SingleRef} from "../references.js"
import {StringsMapper} from "../utils/string-mapping.js"


/**
 * A factory that produces a {@link Language} instance,
 * as well as {@link LanguageEntity entities} contained by that instance
 * and {@link Feature features} of {@link Classifier classifiers}
 * and {@link EnumerationLiteral enumeration literals} of {@link Enumeration enumerations}.
 *
 * The factory methods take care of proper containment.
 * *Note:* also calling `havingEntities`, `havingFeatures`, and `havingLiterals` doesn't produce duplicates.
 * (This is to stay backward compatible.)
 */
export class LanguageFactory {

    readonly id: StringsMapper
    readonly key: StringsMapper
    readonly language: Language

    constructor(name: string, version: string, id: StringsMapper, key: StringsMapper) {
        this.id = id
        this.key = key
        this.language = new Language(name, version, this.id(name), this.key(name))
    }


    annotation(name: string, extends_?: SingleRef<Annotation>) {
        const annotation = new Annotation(this.language, name, this.key(this.language.name, name), this.id(this.language.name, name), extends_)
        this.language.havingEntities(annotation)
        return annotation
    }

    concept(name: string, abstract: boolean, extends_?: SingleRef<Concept>) {
        const concept = new Concept(this.language, name, this.key(this.language.name, name), this.id(this.language.name, name), abstract, extends_)
        this.language.havingEntities(concept)
        return concept
    }

    interface(name: string) {
        const intface = new Interface(this.language, name, this.key(this.language.name, name), this.id(this.language.name, name))
        this.language.havingEntities(intface)
        return intface
    }

    enumeration(name: string) {
        const enumeration = new Enumeration(this.language, name, this.key(this.language.name, name), this.id(this.language.name, name))
        this.language.havingEntities(enumeration)
        return enumeration
    }

    primitiveType(name: string) {
        const primitiveType = new PrimitiveType(this.language, name, this.key(this.language.name, name), this.id(this.language.name, name))
        this.language.havingEntities(primitiveType)
        return primitiveType
    }


    containment(classifier: Classifier, name: string) {
        const containment = new Containment(classifier, name, this.key(this.language.name, classifier.name, name), this.id(this.language.name, classifier.name, name))
        classifier.havingFeatures(containment)
        return containment
    }

    property(classifier: Classifier, name: string) {
        const property = new Property(classifier, name, this.key(this.language.name, classifier.name, name), this.id(this.language.name, classifier.name, name))
        classifier.havingFeatures(property)
        return property
    }

    reference(classifier: Classifier, name: string) {
        const reference = new Reference(classifier, name, this.key(this.language.name, classifier.name, name), this.id(this.language.name, classifier.name, name))
        classifier.havingFeatures(reference)
        return reference
    }


    enumerationLiteral(enumeration: Enumeration, name: string) {
        const enumerationLiteral = new EnumerationLiteral(enumeration, name, this.key(this.language.name, enumeration.name, name), this.id(this.language.name, enumeration.name, name))
        enumeration.havingLiterals(enumerationLiteral)
        return enumerationLiteral
    }

}

