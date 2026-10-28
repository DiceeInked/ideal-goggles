# OneLine Language Project

OneLine has two profiles and a shared translation system:

- **OneLine Core** is the flexible, general-purpose language with near-zero restrictions imposed specifically for portability.
- **OneLine Raw** uses the same syntax but applies strict rules to improve predictability and practical portability.
- **Mixed OneLine** allows individual regions of one program to use Core or Raw rules.

The canonical specification is [SPECIFICATION.md](SPECIFICATION.md). This file is the project index; the specification takes precedence over any abbreviated examples elsewhere.

## Documents

- [Canonical language specification](SPECIFICATION.md)
- [Language overview](LANGUAGE_OVERVIEW.md)
- [Formal grammar](GRAMMAR.md)
- [OneLine Core](CORE.md)
- [OneLine Raw](RAW.md)
- [Syntax examples](SYNTAX.md)
- [Mixing Core and Raw](MIXING.md)
- [Translation model](TRANSLATION.md)
- [Conformance tests](CONFORMANCE.md)
- [Roadmap](ROADMAP.md)

## Design principles

1. One shared grammar, with Raw as a strict profile.
2. Explicit syntax and deterministic diagnostics.
3. Core can preserve source-specific behavior; Raw follows defined portable rules.
4. Mixed files mark each region explicitly.
5. The translator checks behavior and target capabilities rather than promising universal compatibility.

**Status:** Version 0.2 design baseline. The compiler/parser is not implemented yet. Conformance tests must be run before calling the language stable.
