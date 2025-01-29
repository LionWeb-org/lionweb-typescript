import {builtinPrimitives, chain, concatenator, LanguageFactory, lastOf} from "@lionweb/core"
import {hasher} from "@lionweb/utilities"


const factory = new LanguageFactory(
    "libraryWithDates",
    "1",
    chain(concatenator("-"), hasher()),
    lastOf
)
export const libraryWithDatesLanguage = factory.language

const {integerDatatype, stringDatatype} = builtinPrimitives

export const libraryWithDates = factory.concept("LibraryWithDates", false)
const book = factory.concept("Book", false)
const writer = factory.concept("Writer", false)
const guideBookWriter = factory.concept("GuideBookWriter", false, writer)
const specialistBookWriter = factory.concept("SpecialistBookWriter", false, writer)
const bookType = factory.enumeration("BookType")
factory.enumerationLiteral(bookType, "Normal")
factory.enumerationLiteral(bookType, "Special")
export const dateDatatype = factory.primitiveType("Date")

factory.property(libraryWithDates, "name").ofType(stringDatatype).havingKey("library_Library_name")
factory.property(libraryWithDates, "creationDate").ofType(dateDatatype).havingKey("library_Library_creationDate")
factory.containment(libraryWithDates, "books").ofType(book).isMultiple()

factory.property(book, "title").ofType(stringDatatype)
factory.property(book, "pages").ofType(integerDatatype)
factory.reference(book, "author").ofType(writer)
factory.property(book, "type").ofType(bookType).isOptional()

factory.property(writer, "name").ofType(stringDatatype).havingKey("library_Writer_name")
// Note: writers are _not_ contained in the library (node) itself, so are separate nodes.

factory.property(guideBookWriter, "countries").ofType(stringDatatype)

factory.property(specialistBookWriter, "subject").ofType(stringDatatype)

