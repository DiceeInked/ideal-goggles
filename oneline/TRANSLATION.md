# OneLine Translation Model

The canonical language rules are in [SPECIFICATION.md](SPECIFICATION.md). This document defines the translator's responsibilities.

## Pipeline

1. Parse source code with a source-specific parser or compiler frontend.
2. Build a structured syntax tree and semantic model.
3. Represent program meaning in OneLine Core.
4. Apply Raw profile checks to Raw files and Raw regions.
5. Validate interfaces between Core and Raw regions.
6. Compare required behavior with the selected target language and runtime.
7. Generate equivalent code, use a tested adapter, or report a compatibility issue.
8. Validate output with target parsers, compilers, and behavior tests where available.

The translator should use a structured intermediate representation, not repeated string replacement.

## Outcomes

- **Direct:** target behavior matches without adaptation.
- **Adapted:** tested generated code or a supported runtime adapter preserves behavior.
- **Blocked:** the target cannot preserve behavior under current support.
- **Unverified:** equivalence cannot be established reliably.

The checker compares semantics, not merely token names. It considers types, conversions, integer overflow, floating-point precision, division edge cases, evaluation order, errors, returns, runtime APIs, scheduling, and platform requirements.

If source and target behavior already match, translation should proceed without an unnecessary warning. If they differ, Core can preserve source behavior in its semantic representation and the translator can adapt or report the issue. Raw behavior is governed by the Raw specification and must be preserved or flagged.

A useful editor diagnostic identifies the location, source behavior, target behavior, whether a tested adaptation exists, and the next action available to the user. Do not claim universal compatibility.
