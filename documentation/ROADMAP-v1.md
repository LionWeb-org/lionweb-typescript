# ROADMAP to version 1

* Update to 2024.1 specification; that includes:
  * [Remove the JSON Standard Primitive type](https://github.com/LionWeb-io/lionweb-typescript/issues/161)
  * [Add support for value types](https://github.com/LionWeb-io/lionweb-typescript/issues/160)

* Re-organize into packages (this is [issue #154](https://github.com/LionWeb-io/lionweb-typescript/issues/154), which might make [issue #86](https://github.com/LionWeb-io/lionweb-typescript/issues/86) obsolete):
  * `serialization`: all serialization types — issues [#107](https://github.com/LionWeb-io/lionweb-typescript/issues/107) and [#106](https://github.com/LionWeb-io/lionweb-typescript/issues/106) can be considered to address this as well
  * `base`: base types such as `Node`
  * `internal-utils`: internal utilities, such as for working with arrays, maps, doing topological sorting, etc.
  * `m3`: LionCore M3
  * `m2`: LionCore builtins, language (de-)serialization, factories, (maybe some!) convenience/helper functionality
  * `m1`: model (de-)serialization
  * `validation`: validation of serialization chunks — as standalone as possible
  * `utilities`: ?
  * `queries`: ?

* Rename `InstantiationFacade` &rarr; `Factory`
  * And `ExtractionFacade` &rarr; `Reflector`?

* Give deserialization a better API:
  * Pair up languages and their factories
  * Make deserialization more configurable:
      * How to deal with unknown classifiers: dynamic instantiation (i.e.: a fall-back factory for the `DynamicNode` type), or ignore
      * Provide a channel to report back (and possibly even “converse”) about unknown classifiers, in such a way that we can distinguish between annotations and concepts
      * Provide a default configuration that is verbose on the console about things missing (like it is now)
      * Provide a way to modify the instantiation, e.g. to install MobX-type things.
  * This is based on the following principles:
    * We can deal with broken models, so a “small” problem in the serialization should not prevent the deserialization as a whole.
      (The GPL types that the model is deserialized into might have a different opinion about it, but that's its problem.)
    * We should uncover _all_ problems during deserialization, not just the first one and then quit.
    * I (=MB) find it useful to do things in an FP-style, so effectively everything should be a `flatMap` of-sorts.
    	In the end, it should be understandable and usable — that's the final criterion.
  * Split readable and writable parts of `Node` interface.
    * Provide factory getter and `setFeatureValue` that knows about moving children between parents in writable part.

* Issues:
  * [Implement reference utils](https://github.com/LionWeb-io/lionweb-typescript/issues/165)
  * [Fix deserialization to work with meta-circular language definitions](https://github.com/LionWeb-io/lionweb-typescript/issues/164)
  * [Update top-level `README.md` to also document release process](https://github.com/LionWeb-io/lionweb-typescript/issues/152)

