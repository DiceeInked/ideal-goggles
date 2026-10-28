# OneLine Roadmap

The canonical design baseline is [SPECIFICATION.md](SPECIFICATION.md), with parser details in [GRAMMAR.md](GRAMMAR.md) and expected test behavior in [CONFORMANCE.md](CONFORMANCE.md).

## Settled design

- Core is the flexible, general-purpose form with near-zero Raw-specific restrictions.
- Raw uses the same syntax and adds strict rules for predictable behavior and practical portability.
- Mixed files use one mixd()[...] root with explicit, non-nested core()[...] and rawb()[...] regions.
- Ordinary built-ins use three-letter tokens; block tokens use four letters, with and/or as boolean operators.
- Text literals are quoted inside txt(...).
- Semicolons separate simple statements; newlines do not.
- Source order controls ordinary execution. Numeric block priority labels are removed.
- func defines, fun calls, and par reads parameters.
- Raw requires explicit types and return types, rejects implicit conversions, and defines numeric/error behavior.
- A local cannot share a global's name, but separate functions can reuse local names.
- Invalid or ambiguous code must be rejected rather than guessed.

## Implementation phases

1. Implement lexical rules and grammar.
2. Build an AST with source spans and parser diagnostics.
3. Implement Raw type, scope, return-path, arithmetic, and boolean checks.
4. Implement Core semantic metadata and richer value support.
5. Implement mixed-mode regions and boundary validation.
6. Add one source-language frontend and one target generator.
7. Add behavior-preservation tests and compatibility diagnostics.
8. Expand language and platform support only when semantics can be verified.

## Stability rule

Version 0.2 is a coherent design baseline, not yet a stable implementation. Call it stable only after the grammar is implemented, conformance tests pass, and runtime behavior has been validated. The documentation must not claim the compiler exists until it does.
