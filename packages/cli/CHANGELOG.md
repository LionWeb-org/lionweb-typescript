# Changelog

## 0.6.13

* (Depend on `@lionweb/core` and `@lionweb/utilities` version 0.6.12.)


## 0.6.12

* Separate CHANGELOG from README.
* (Depend on `@lionweb/core` and `@lionweb/utilities` version 0.6.11.)


## 0.6.11

* (Depend on `@lionweb/core` and `@lionweb/utilities` version 0.6.10.)


## 0.6.10

* (Depend on `@lionweb/core` and `@lionweb/utilities` version 0.6.9.)
* Use the `AggregatingSimplisticHandler` to report on language deserialization problems.


## 0.6.9

* (Depend on `@lionweb/core` and `@lionweb/utilities` version 0.6.8.)


## 0.6.8

* (Depend on `@lionweb/core` and `@lionweb/utilities` version 0.6.7.)


## 0.6.7

* (Depend on `@lionweb/core` and `@lionweb/utilities` version 0.6.6.)


## 0.6.6

* TS types generator now generates 1 file per language.
  The output directory will be `<languages serialization chunk's file name>_gen/`.
* The `infer-language` command has been renamed to `infer-languages` (without deprecated alias).


## 0.6.5

* Extend metrics functionality.


## 0.6.4

* Add a command `infer-language` that infers a language from the given serialization chunk.


## 0.6.3

* Add a command `measure` that computes metrics.


## 0.6.2

* Expose diffing functionality from `@lionweb/validation`


## 0.6.1

* Fix that `@lionweb/validation` was not specified as a (non-dev) dependency.


## 0.6.0

* Change the `diagram` command to output PlantUML and Mermaid diagram files _per language_.
* Add a `validation` commmand to validate JSON files as serialization chunks.
* Remove the shortening functionality from `extract`.
* Rename the `extract` command &rarr; `sort`, and remove the textualization for chunks that are the serialization of languages.
* Textualizing a serialization chunk of languages will use the LionCore/M3-specific syntax _unless_ the flag `--languagesAsRegular` is an argument.
* Add a `repair` command.
* Add a `textualize` command – that's optionally language-aware – to render a JSON serialization chunk as pure text.


## 0.5.0

This is the first version corresponding to a release of LionWeb (version: 2023.1) as a whole.

* Make language-related functionality "multi-lingual", i.e. a serialization chunk can contain multiple `Language`s.
    * (Languages will be sorted by name.)
* Improve extraction functionality: only catch JSON-parsing exceptions.
* Configure single entrypoint named `lionweb-cli`.


## Prior to 0.5.0

No changelog has been kept for previous versions, regardless of whether these were published or not.

