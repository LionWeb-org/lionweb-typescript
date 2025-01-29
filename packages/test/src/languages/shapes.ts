import {builtinClassifiers, builtinPrimitives, chain, concatenator, LanguageFactory, lastOf} from "@lionweb/core"
import {hasher} from "@lionweb/utilities"


const factory = new LanguageFactory(
    "Shapes",
    "1",
    chain(concatenator("-"), hasher({ encoding: "base64" })),
    lastOf
)
export const shapesLanguage = factory.language

export const Coord = factory.concept("Coord", false)
const Geometry = factory.concept("Geometry", false)
const Shape = factory.concept("Shape", true).implementing(builtinClassifiers.inamed)
export const Circle = factory.concept("Circle", false, Shape)
const Line = factory.concept("Line", false, Shape)

factory.containment(Geometry, "shapes").ofType(Shape).isMultiple().isOptional()
factory.containment(Line, "start").ofType(Coord)
factory.containment(Line, "end").ofType(Coord)
factory.property(Circle, "r").ofType(builtinPrimitives.integerDatatype)
factory.containment(Circle, "center").ofType(Coord)

factory.property(Coord, "x").ofType(builtinPrimitives.integerDatatype)
factory.property(Coord, "y").ofType(builtinPrimitives.integerDatatype)
factory.property(Coord, "z").ofType(builtinPrimitives.integerDatatype)

export const Annotated = factory.annotation("Annotated").annotating(Shape)


