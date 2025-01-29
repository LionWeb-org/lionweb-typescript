import {Classifier, isINamed, Language, M3Concept} from "./types.js"
import {allContaineds, flatMap, inheritedCycleWith, keyOf, namedsOf, qualifiedNameOf} from "./functions.js"
import {idOf} from "../functions.js"
import {isValidIdentifier} from "../types.js"
import {duplicatesAmong} from "../utils/map-helpers.js"


/**
 * Type definition for an issue corresponding
 * to a violation of a constraint on a {@link M3Concept language object}.
 */
export type Issue = {
    location: M3Concept
    message: string
    secondaries: M3Concept[]
}
// TODO  back this type with an M2


/**
 * Computes the {@link Issue issues} (i.e., constraint violations) for the given language.
 * (This computation is resilient against e.g. inheritance cycles.)
 */
export const issuesLanguage = (language: Language): Issue[] =>
    [
        ...flatMap(
            language,
            (t) => {

                const issues: Issue[] = []
                const issue = (message: string, secondaries?: M3Concept[]): void => {
                    issues.push({
                        location: t,
                        message,
                        secondaries: secondaries ?? []
                    })
                }

                // The id consists only of latin characters (upper/lowercase), numbers, underscores, and hyphens
                const id = t.id.trim()
                !isValidIdentifier(id) && issue(`An ID must consist only of latin characters (upper/lowercase), numbers, underscores, and hyphens`)

                // The key consists only of latin characters (upper/lowercase), numbers, underscores, and hyphens
                const key = t.key.trim()
                !isValidIdentifier(key) && issue(`A KEY must consist only of latin characters (upper/lowercase), numbers, underscores, and hyphens`)

                if(isINamed(t)) {
                    const trimmedName = t.name.trim()
                    // The name should be a non-empty string
                    trimmedName.length === 0 && issue(`A ${t.constructor.name}'s name must not be empty`)

                    // The name should not contain whitespace characters
                    trimmedName.includes(" ") && issue(`A ${t.constructor.name}'s name cannot contain whitespace characters`)
                }

                if (t instanceof Language) {
                    // The name should not start with a number
                    const name = t.name.trim()
                    !isNaN(parseInt(name[0])) && issue(`A Language's name cannot start with a number`)

                   // The version is a non-empty string
                    const version = t.version.trim();
                    version.length === 0 && issue(`A Language's version must be a non-empty string`)
                }

                // The classifier should not inherit from itself (directly or indirectly)
                if (t instanceof Classifier) {
                    const cycle = inheritedCycleWith(t);
                    (cycle.length > 0) && issue(`A ${t.constructor.name} can't inherit (directly or indirectly) from itself, but ${qualifiedNameOf(t)} does so through the following cycle: ${cycle.map((t) => qualifiedNameOf(t)).join(" -> ")}`)
                            // TODO  check whether it needs to be "a" or "an", or just say "An instance of ..."
                }

                return issues
            }
        ),
        ...Object.entries(duplicatesAmong(allContaineds(language), idOf))
            .flatMap(
                ([id, ts]) => ts.map(
                    (t) => ({ location: t, message: `Multiple (nested) language elements with the same ID "${id}" exist in this language`, secondaries: ts.filter((otherT) => t !== otherT) })
                )
            ),
        ...Object.entries(duplicatesAmong(namedsOf(language), keyOf))   // all M3Concept-s that are INamed are also IKeyed
            .flatMap(
                ([key, ts]) => ts.map(
                    (t) => ({ location: t, message: `Multiple (nested) language elements with the same key "${key}" exist in this language`, secondaries: ts.filter((otherT) => t !== otherT) })
                )
            ),
        ...Object.entries(duplicatesAmong(namedsOf(language), qualifiedNameOf))
            .flatMap(
                ([key, ts]) => ts.map(
                    (t) => ({ location: t, message: `Multiple (nested) language elements with the same key "${key}" exist in this language`, secondaries: ts.filter((otherT) => t !== otherT) })
                )
            )
    ]


// not here: unresolved references are a problem on a lower level
// TODO (#8)  check whether references are resolved
// Same goes for duplicate IDs, but for completeness' and symmetry's sake, we're also checking it here.

