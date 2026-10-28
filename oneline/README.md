# OneLine Language Project

OneLine is a compact, function-shaped programming language concept with two related forms:

- **OneLine Core** is the flexible semantic foundation used by the translator. It can represent behavior that differs between source and target languages without forcing every language to pretend it behaves the same way.
- **OneLine Raw** is the strict, portable language intended for people to write directly. It aims to make programs easier to translate by restricting ambiguous or target-specific behavior.

These are two forms of one project, not two unrelated implementations. Core describes program meaning; Raw defines a portable set of rules that can be checked against Core and target-language capabilities.

> **Status:** Design draft. This documentation records the decisions made so far and proposes consistent rules where the syntax was not yet fully settled. It is not yet an implemented compiler or a guarantee that every program can run on every platform.

## Documents

- [Language overview and shared rules](LANGUAGE_OVERVIEW.md)
- [OneLine Core specification](CORE.md)
- [OneLine Raw specification](RAW.md)
- [Syntax reference and examples](SYNTAX.md)
- [Translation model and compatibility checks](TRANSLATION.md)
- [Open decisions and implementation roadmap](ROADMAP.md)

## Current design principles

1. Prefer explicit, deterministic syntax over guessing.
2. Report invalid or ambiguous code instead of silently repairing it.
3. Preserve source-program behavior where possible.
4. Tell the user when a target language cannot preserve behavior exactly.
5. Keep language design separate from the translator implementation.
6. Keep examples and syntax consistent across the documentation.

## Naming

The names **OneLine Core** and **OneLine Raw** are written with a space in prose. The repository folder is `oneline/`. The compact language name may be written as `OneLine`; the visual labels `OneLine Core` and `OneLine Raw` distinguish the two forms.
