# OneLine: Shared Language Overview

**Status:** Draft specification, version 0.1  
**Purpose:** Define the concepts shared by OneLine Core and OneLine Raw before implementing a parser or translator.

## 1. The two forms

### OneLine Core

Core is the translator's flexible representation of program meaning. It is designed to express operations and behavior without automatically imposing every limitation found in a particular programming language.

Core may represent a language-specific semantic rule when that rule is necessary to preserve the original program. For example, one source language might define division by zero as an error while another might produce a special numeric value. Core must be able to distinguish these behaviors rather than silently merge them.

Core is primarily infrastructure for translation. It may eventually be available to advanced users, but public editing tools do not need to expose every internal representation.

### OneLine Raw

Raw is the strict language people can write directly. Its purpose is predictable behavior and practical portability. It should avoid implicit conversions, ambiguous syntax, undeclared names, and behavior that cannot be represented consistently.

Raw aims for broad portability; it cannot guarantee compatibility with every programming language, runtime, or platform. A target may lack a feature, impose different limits, or be unable to reproduce a program's behavior. The translator must report those cases honestly.

Raw is not simply “every disadvantage from every language combined.” It is a deliberately restricted set of rules chosen to make programs predictable and translatable.

## 2. Shared syntax shape

OneLine uses short, function-like tokens with nested parenthesized arguments. Code bodies are enclosed in square brackets.

- Ordinary expressions and statements use a token followed by parentheses: `val(...)`, `cal(...)`, `set(...)`.
- Block constructs use a four-letter token followed by a bracketed body: `flag()[...]`, `reap()[...]`, and `func(...)[...]`.
- Whitespace and line breaks are for readability, not statement separation. Token boundaries and delimiters determine the structure.
- Text literals use double quotation marks inside `txt(...)`. Parentheses and punctuation inside a quoted text literal are text, not syntax.
- Comments begin with `//` and continue to the end of the line.
- A slash-delimited item such as `/NAME/` in explanatory documentation is a placeholder, not executable syntax.

### Token-length convention

The intended convention is three-letter tokens for ordinary built-ins and four-letter tokens for block constructs. Boolean conjunction and disjunction are written as `and` and `or`.

This convention still needs a final grammar pass because several earlier examples used longer or shorter structural words, such as `if`, `do`, `EL`, `return`, and `SAY`. The proposed normalized spellings are listed in [SYNTAX.md](SYNTAX.md). They are draft choices, not a claim that the grammar has already been implemented.

## 3. Parsing and errors

A conforming parser must not guess what malformed code was intended to mean.

It must report, at minimum:
- Missing or mismatched delimiters.
- Unknown built-in tokens.
- Invalid literal syntax.
- Duplicate declarations in a prohibited scope.
- Reads of variables that do not exist or are not yet available.
- Calls to functions that have not been defined yet.
- Incorrect argument counts or parameter types.
- Return values that do not match the declared return type.
- Invalid operations for the supplied types.

Error messages should identify the location and explain a concrete correction when one can be determined safely. The translator must not silently change a program's behavior.

## 4. Execution order

Source order is the default ordering rule. Explicit block priority numbers are removed.

- A function must be defined before a call to it appears in the source.
- Top-level statements execute in source order unless a construct explicitly defines a different scheduling rule.
- A `reap` block registers recurring work according to its declared rate. Its exact scheduling and frame/tick model must be defined by the runtime.
- Blocks at the same location do not become simultaneous merely because they are placed on separate lines.

## 5. Types and names

The current type family includes:
- `int`: integer number.
- `flo`: floating-point number.
- `num`: numeric type inferred from a numeric literal, or a numeric union type where explicitly declared.
- `txt`: text.
- `boo`: boolean.
- `nul`: no value / null.

The exact distinction between a `num` literal wrapper and a declared `num` parameter is specified in the Core and Raw documents.

Function parameters and return types are explicitly declared. Implicit conversion between unrelated types is not allowed in Raw.

A local variable may not reuse a global variable's name. Separate functions may reuse the same local variable name because their local scopes are independent.

## 6. Translation promise

The translator aims to preserve meaning, not just produce code that looks similar.

For each requested target, the translator should report one of three outcomes:
1. **Compatible:** behavior can be preserved directly.
2. **Transformable:** behavior can be preserved by generating additional code or using a supported library/runtime.
3. **Incompatible or unverified:** behavior cannot be preserved reliably without a change, a user decision, or additional target support.

A successful parse is not proof that a program can be translated to every target.
