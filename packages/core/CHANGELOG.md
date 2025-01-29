# Changelog

## 0.6.12

* `LanguageFactory` instances take care of containment: e.g., creating an entity automatically adds that to the language, and likewise for features (to classifiers) and literals (to enumerations). 

* Add an object type `SerializationOptions` to configure the `serializeNodes` function.
    All options (which are all optional) are:

    1. `serializeEmptyValues`: a boolean flag that determines whether empty (unset) feature values are explicitly serialized or skipped during serialization.
        This potentially reduces the size of the serialization substantially, helping with performance.
        The default value is `true`, meaning that empty values are explicitly serialized — either as `null` for properties, or `[]` for links.
    2. `primitiveTypeSerializer`: an implementation of the `PrimitiveTypeSerializer` interface type.
        The default value is an instance of `DefaultPrimitiveTypeSerializer`.

    A primitive type serializer can be passed to `serializeNodes` in two ways:

    1. Via the `primitiveTypeSerializer` field of the `SerializationOptions` object that's passed as the 3rd argument.
    2. Directly as the 3rd argument. (*Warning!* This way may become deprecated in the future.)

* Widen type of argument of `idOf` to `Node`.

* Have the `INamed` interface not extend `Node`.
    Also remove unused `isIKeyed` function.

* Add `featureMetaType` function and `FeatureMetaType` type.

* Expose `metaPointerFor` function that computes the `MetaPointer` for a `Feature`.

* Expose `IdOrUnresolved` type that expresses a value is either an `Id` or a value to indicate that resolution to a node previously failed.

* Expose `isMultiple` function that determines whether a `Feature` is multi-valued.


## 0.6.11

* Separate CHANGELOG from README.
* Move the reference util functions (`referenceValues`, `incomingReferences`, `referencesToOutOfScopeNodes`) and type (class `ReferenceValue`) from the `utilities` package to `core`.
    Aliases (as re-exports) are left in its place to avoid code breaking.
    The move is necessary because not all clients of `@lionweb/utilities` can install the Node.js-specific dependencies of the dependencies that package (such as `crypto`).
* The `childrenExtractorUsing` and `nodesExtractorUsing` functions now also extract annotations — ([issue 181](https://github.com/LionWeb-io/lionweb-typescript/issues/181)).


## 0.6.10

* Make `DefaultPrimitiveTypeDeserializer` and `DefaultPrimitiveTypeSerializer` be able to deal with duplicate definitions of datatypes.
    * Expose a function `shouldBeIdentical` that determines whether two datatypes should be structurally equal based on equality of: meta type, key, and language's key.
* Make serializer more resilient against unresolved (i.e., `null`-valued) children.
* Fix that `resolveInfo` of a serialized reference must be `null`, not `undefined`.


## 0.6.9

* Improve deserialization:
    * Produce more meaningful messages for problems
    * Configure how problems are reported through an instance of a `SimplisticHandler`, calling a new function `deserializeLanguagesWithHandler`.
      The default value for the handler is `defaultSimplisticHandler` which just reports the problem to the JavaScript console (using `console.log`).
      The `AccumulatingSimplisticHandler` class accumulates the problems reported, which can be accessed through its `allProblems` method.
      The `AggregatingSimplisticHandler` class aggregates the problems reported (with count), which can be output using its `reportAllProblemsOnConsole` method, and accessed through its `allProblems` method.
    * Pass dependent languages also _as languages_ from languages deserializer to regular deserializer, not just as referable data (which is only useful for the built-ins)
* Fix a bug in the serializer that caused an "unhelpful" exception on an unset or unresolved — i.e., "not-connected", represented by a `null` value — reference target .
  Now, such reference targets are simply skipped.


## 0.6.8

* With respect to deserialization:
    * Relax deserialization to just skip serialized nodes for which the corresponding M2 data can't be found.
    * Fix a bug w.r.t. enumeration literals — deserializing changed the keys of enumeration literals in the language's definition.
    * Deserialization doesn't throw on unresolvable references, but warns on the console and returns `null` (which means “unresolved”).
* Export `byIdMap` function, which computes a map id &rarr; thing from an array of things with an `id`, from the package.
* Make `SerializedProperty.value` `null`-able, to align with the specification.


## 0.6.7

* Fix cycle in imports that some bundlers were having trouble with.


## 0.6.6

* The serializer now also serializes annotations.
* Add support for custom primitive types.
  Specifically:
    * A new interface type `PrimitiveTypeSerializer`.
    * A default implementation `DefaultPrimitiveTypeSerializer` of that that's aware of the LionCore built-in primitive types.
    * `serializeNodes` has an additional argument of type `PrimitiveTypeSerializer` with as default value an instance of `DefaultPrimitiveTypeSerializer`.


## 0.6.5

* Add support for custom primitive types.
  Specifically:
    * A new interface type `PrimitiveTypeDeserializer`.
    * A default implementation `DefaultPrimitiveTypeDeserializer` of that that's aware of the LionCore built-in primitive types.
    * `deserializeSerializationChunk` has an additional argument of type `PrimitiveTypeDeserializer` with as default value an instance of `DefaultPrimitiveTypeDeserializer`.
* Expose function `inheritsFrom`.


## 0.6.4

* Add functions `mapValues` and `instantiableClassifiers`.
* Add a method `SymbolTable.languageMatching` to look up a language.


## 0.6.3

* The deserializer now deserializes all nodes in the serialization chunk, not just the root nodes (identified as having `parent` set to `null`).
  (This fixes [issue #145](https://github.com/LionWeb-io/lionweb-typescript/issues/145).)
    * Also: `deserializeChunk` is renamed to `deserializeSerializationChunk` for naming consistency, although `deserializeChunk` is retained as an alias.
* Add a method `metaType` to M3 types, to deduce classifiers' names from.
  (That fixes [issue #143](https://github.com/LionWeb-io/lionweb-typescript/issues/143).)


## 0.6.2

* Add a method `Classifier.metaPointer`.


## 0.6.1

* Introduce a `isBuiltinNodeConcept` function that checks whether a classifier happens to be the `Node` concept built into LionCore.
* Add a reference `annotates` to `Annotation`.


## 0.6.0

* Introduce a type `SymbolTable` to encapsulate lookup of languages' entities and their features.
    * Provide a naive and a memoising implementation of the `SymbolTable` abstraction, and use the latter in the deserializer to make that (a bit) more performant.


## 0.5.0

This is the first version corresponding to a release of LionWeb (version: 2023.1) as a whole.

* Remove JSON Schema generation functionality – this wasn't up-to-date at all.
* Implement persistence of annotations on `Node`s, including (de-)serialization.
* Added an optional field `resolveInfoFor` to the `ExtractionFacade` type, to compute the field `resolveInfo` field of a serialized reference target.
  The default used is to check whether a node instance implements `INamed` and takes the value of the `name` field.
* _Breaking change:_ `serializeLanguage` and `deserializeLanguage` are now "multi-lingual" in the sense that a serialization chunk can contain multiple `Language`s.
  As a result, these functions have been renamed to (the plural) `serializeLanguages` (with varargs), and `deserializeLanguages` (returning `Language[]`).
* (Bugfix:) Deserialize `Annotation`s.
* _Breaking change:_ Rework ID and key generation in the LionCore `LanguageFactory`.
  As part of that:
    * Add `String[s]Mapper` types, a `StringsMapper` instance `last`, and functions `concatenator` and `chain` to produce instances of them.
    * Remove `M3Node.keyed` and the "awkward" key generation in the `InstantiationFacade` for the LionCore language.
    * Remove types `IdGenerator`, and `KeyGenerator` and everything related to that.
    * Expose keys (instead of qualified names) for LionCore M3 and the LionCore built-ins.
* Add a type `DynamicINamed` and an M3-function `conceptsOf`, primarily for generation purposes.
* Move `asText` and ID checking to `@lionweb/utilities`.
* Expose a helper function `nameSorted`.
* Rename `ConceptInterface` &rarr; `Interface`.
* Change names: `ReadModelAPI` &rarr; `ExtractionFacade`, `WriteModelAPI` &rarr; `InstantiationFacade`.
* Change name of `concept` fields to `classifier`, and their types (where applicable) to `Classifier`.
* Fix `license` field in `package.json` to `"Apache-2.0"`.
* Replace all occurrences of "LIon" (with uppercase 'I') with "Lion" (with lowercase 'i').
* Split the `ModelAPI` interface into a read- and write-part: `ReadModelAPI` vs. `WriteModelAPI`.
* Make fixes w.r.t. multi-language models.
* Migrate from Deno to Node.js.
* Implement import of enums in Ecore importer.


## Prior to 0.5.0

No changelog has been kept for previous versions, regardless of whether these were published or not.

