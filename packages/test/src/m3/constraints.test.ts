import {deepEqual, fail} from "assert"

import {chain, concatenator, Concept, issuesLanguage, Language, LanguageFactory, lastOf} from "@lionweb/core"
import {nanoIdGen} from "@lionweb/utilities"


describe("general LionCore constraints - name/version" , () => {

    it("should (name) be non-empty", () => {
        const language = new Language("", "0", "x", "x")
        const issues = issuesLanguage(language)
        // deepEqual(issues.length, 1)
        deepEqual(issues[0], {
            location: language,
            message: "A Language's name must not be empty",
            secondaries: []
        })
    })  
    
    it("should (name) not start with a number", () => { 
        const language = new Language("1myLang", "0", "x", "x")
        const issues = issuesLanguage(language)
        // deepEqual(issues.length, 1)
        deepEqual(issues[0], {
            location: language,
            message: "A Language's name cannot start with a number",
            secondaries: []
        })
    })    

    it("should (version) be non-empty", () => {
        const language = new Language("myLang", "", "x", "x")
        const issues = issuesLanguage(language)
        // deepEqual(issues.length, 1)
        deepEqual(issues[0], {
            location: language,
            message: "A Language's version must be a non-empty string",
            secondaries: []
        })
    })

    it("should not contain whitespace characters", () => {
        const language = new Language("my Lang", "0", "x", "x")
        const issues = issuesLanguage(language)
        // deepEqual(issues.length, 1)
        deepEqual(issues[0], {
            location: language,
            message: "A Language's name cannot contain whitespace characters",
            secondaries: []
        })
     })

    it("should support Unicode characters, numbers, and underscores", () => { 
        const languageName = "myLang_123_𝟜𝟝𝟞";
        const language = new Language(languageName, "0", "x", "x");
        const issues = issuesLanguage(language);
        deepEqual(issues.length, 0)
    })

})


describe("Identifiers and Keys", () => {

    it("should (Key) be unique within its id-space", () => {
        const language = new Language("myLang", "0", "x", "x")
        const concept1 = new Concept(language, "myConcept1", "key_y", "id_1", false)
        const concept2 = new Concept(language, "myConcept2", "key_y", "id_2", false)
        language.havingEntities(concept1, concept2)

        const issues = issuesLanguage(language)
        deepEqual(issues[0], {
            location: concept1,
            message: `Multiple (nested) language elements with the same key "key_y" exist in this language`,
            secondaries: [concept2]
        })

        deepEqual(issues[1], {
            location: concept2,
            message: `Multiple (nested) language elements with the same key "key_y" exist in this language`,
            secondaries: [concept1]
        })
     })

    it("should (Identifiers) be unique within its id-space", () => {
        const language = new Language("myLang", "0", "x", "x")
        const concept1 = new Concept(language, "myConcept1", "key_1", "id_y", false)
        const concept2 = new Concept(language, "myConcept2", "key_2", "id_y", false)
        language.havingEntities(concept1, concept2)

        const issues = issuesLanguage(language)
        deepEqual(issues[0], {
            location: concept1,
            message: `Multiple (nested) language elements with the same ID "id_y" exist in this language`,
            secondaries: [concept2]
        })

        deepEqual(issues[1], {
            location: concept2,
            message: `Multiple (nested) language elements with the same ID "id_y" exist in this language`,
            secondaries: [concept1]
        })
    })
    
    it("should (id) consist only of latin characters (upper/lowercase), numbers, underscores, and hyphens", () => { 
        const language = new Language("myLang", "0", "*/", "x")
        const issues = issuesLanguage(language)
        deepEqual(issues[0], {
            location: language,
            message: "An ID must consist only of latin characters (upper/lowercase), numbers, underscores, and hyphens",
            secondaries: []
        })
    })
    
    it("should (key) consist only of latin characters (upper/lowercase), numbers, underscores, and hyphens", () => { 
        const language = new Language("myLang", "0", "0", "*/x")
        const issues = issuesLanguage(language)
        deepEqual(issues[0], {
            location: language,
            message: "A KEY must consist only of latin characters (upper/lowercase), numbers, underscores, and hyphens",
            secondaries: []
        })
    })

})


describe("Language constraints", () => {

    it("should (entities, concept,...) have names", () => {
        const language = new Language("", "0", "x", "x")
        const concept = new Concept(language, " my lang  ", "y", "y", false)
        language.havingEntities(concept)
        const issues = issuesLanguage(language)
        deepEqual(issues.length, 2)
        deepEqual(issues[0], {
            location: language,
            message: "A Language's name must not be empty",
            secondaries: []
        })

        deepEqual(issues[1], {
            location: concept,
            message: "A Concept's name cannot contain whitespace characters",
            secondaries: []
        })
    })
})


describe("Concept constraints", () => {

    it("check that inheritance cycles are detected", () => {
        const factory = new LanguageFactory("metamodel", "1", chain(concatenator("-"), nanoIdGen()), lastOf)
        const {language} = factory
        const cis = [0, 1, 2].map((i) => factory.interface(`interface_${i}`))
        cis[2].extends.push(cis[1])
        cis[1].extends.push(cis[0])
        cis[0].extends.push(cis[2])

        const issues = issuesLanguage(language)
        deepEqual(issues.length, 3)
        const message1 = issues?.find(({location}) => location === cis[0])?.message
        deepEqual(message1, "A Interface can't inherit (directly or indirectly) from itself, but metamodel.interface_0 does so through the following cycle: metamodel.interface_0 -> metamodel.interface_2 -> metamodel.interface_1 -> metamodel.interface_0")
    })

    it("check that trivial inheritance cycles are detected", () => {
        const factory = new LanguageFactory("metamodel", "1", chain(concatenator("-"), nanoIdGen()), lastOf)
        const {language} = factory
        const ci = factory.interface("foo")
        ci.extends.push(ci)

        const issues = issuesLanguage(language)
        deepEqual(issues.length, 1)
        const {location, message} = issues[0]
        deepEqual(location, ci)
        deepEqual(message, "A Interface can't inherit (directly or indirectly) from itself, but metamodel.foo does so through the following cycle: metamodel.foo -> metamodel.foo")
    })

})


// TODO  check the metametamodel specification why that states these as constraints:


describe("Element references", () => {
    it.skip("should reference elements within the same language", () => { fail("not yet implemented") })
    it.skip("should reference elements within declared dependencies", () => { fail("not yet implemented") })
    it.skip("should reference elements within transitive dependencies", () => { fail("not yet implemented") })
})


describe("dependency declaration", () => {
    it.skip("should be an optional declaration for transitive and built-in dependencies", () => { fail("not yet implemented") })
})


describe("Annotation constraints", () => {
    it.skip("should not allow multiple and annotates flags to be redefinable in sub-annotations", () => { fail("not yet implemented") })
    it.skip("should be associated only with the concept types they are meant to annotate or their sub-concepts", () => { fail("not yet implemented") })
})


describe("Feature constraints", () => {
    it.skip("should have feature names that are unique within their Classifier scope, including inherited features", () => { fail("not yet implemented") })
    it.skip("should identify features by id or key in LionWeb in case of name clashes", () => { fail("not yet implemented") })
})


describe("Partition constraints", () => {
    it.skip("should have each node exist in one partition, defined by its root node", () => { fail("not yet implemented") })
    it.skip("should not allow partitions to be nested", () => { fail("not yet implemented") })
})


describe("Namespace constraints", () => {
    it.skip("should contain INamed descendants and enforce constraints like name uniqueness within the namespace and validity criteria for names", () => { fail("not yet implemented") })
})


// TODO  this is a model-level constraint: why is it in the M3 specification?
// it.skip("should have root nodes with the partition flag set to true", () => { fail("not yet implemented") })

