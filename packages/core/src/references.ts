import {Id} from "./types.js"


/**
 * The `unresolved` symbol indicates a reference value which hasn't been resolved yet.
 * It differs from an unset (`undefined`) value.
 */
export const unresolved = null

/**
 * A type definition for a reference value that can be unresolved.
 */
export type SingleRef<T> = typeof unresolved | T

/**
 * Checks whether a given (at most) single-valued reference actually refers to something.
 */
export const isRef = <T>(ref?: SingleRef<T>): ref is T =>
    ref !== undefined && ref !== unresolved

/**
 * A type alias for a multi-valued reference, to make it look consistent with {@link SingleRef}.
 */
export type MultiRef<T> = T[]


/**
 * A type that expresses a value is either an {@link Id} or a value to indicate that resolution to a node previously failed.
 */
export type IdOrUnresolved = Id | typeof unresolved;

