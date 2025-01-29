import {expect} from "chai"

import {concatenator, LanguageFactory, lastOf, serializeLanguages} from "@lionweb/core"


describe("serialization of a language", () => {

    it("doesn't fail when an annotation doesn't specify what it annotates", () => {
        const factory = new LanguageFactory("annotation-language", "0", concatenator("-"), lastOf)
        factory.annotation("annotation")
        const serializationChunk = serializeLanguages(factory.language)
        const annotationNode = serializationChunk.nodes.find((node) => node.id === "annotation-language-annotation")
        expect(annotationNode).to.not.be.undefined
        const serializedReference = annotationNode!.references.find((serRef) => serRef.reference.key === "Annotation-annotates")
        expect(serializedReference).to.not.be.undefined
        expect(serializedReference!.targets).to.eql([])
    })

})

