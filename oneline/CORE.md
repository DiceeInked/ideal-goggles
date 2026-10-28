# OneLine Core Specification

**Status:** Draft, version 0.1  
**Role:** Flexible internal language and semantic representation used by the translator.

## 1. Purpose

OneLine Core represents what a program means without forcing every source and target language to share identical runtime limitations. It is intended to make translation decisions explicit.

Core is not required to behave like every target language. Instead, it must be able to represent relevant differences in behavior and let the translator decide whether the requested target can preserve them.

## 2. Syntax

Core uses OneLine's function-like expressions, nested parentheses, and square-bracketed code bodies. The parser must use a formal grammar rather than guessing from whitespace.

The shared token conventions and proposed normalized spellings are in [SYNTAX.md](SYNTAX.md). If Core needs to represent a behavior that Raw forbids, the representation must be explicit and machine-readable. It must not be encoded as a vague comment that the translator can miss.

## 3. Values and types

The current value forms are:

| Form | Meaning |
|---|---|
| `val(X)` | General value wrapper, where retained by the grammar |
| `boo(TRUE)`, `boo(FALSE)` | Boolean literal |
| `nul()` | Null / no-value literal |
| `txt("text")` | Text literal |
| `int(5)` | Explicit integer literal |
| `flo(5.5)` | Explicit floating-point literal |
| `num(1)` | Numeric literal whose kind is inferred from its spelling |
| `num(0.1)` | Numeric literal inferred as floating-point |
| `var(name)` | Read a declared variable |
| `par(name)` | Read a function parameter |

The token `num` does not mean that all numeric values are interchangeable. Core records whether a value is integer, floating-point, or a broader numeric value. Where source-language behavior depends on overflow, precision, or integer division, the translator must preserve that detail or report a limitation.

## 4. Variables and scope

- `glo(...)` declares a global variable.
- `loc(...)` declares a local variable.
- `set(...)` assigns a new value to an existing variable.
- `var(...)` reads a variable.
- `par(...)` reads a function parameter.

Declarations must be explicit. Reads before declaration and duplicate declarations in a prohibited scope are errors.

A local cannot share a name with a global. Two different functions may each declare a local with the same name. Local names are resolved within their function; they do not overwrite one another.

The exact argument grammar for declarations should follow the canonical patterns in [SYNTAX.md](SYNTAX.md).

## 5. Functions

Functions use the four-letter block token `func`. Function calls use `fun`. Parameter reads use `par`.

Proposed canonical declaration:

```text
func(("double")((num)(x))((int)))[
  return(cal(num(par(x))*num(2)))
]
```

This declares `double`, accepts a numeric parameter `x`, and declares an integer return type. The example is illustrative of the structure; the final type checker must verify that the body actually returns an integer for every valid input, or the declared return type must be changed.

The parameter list contains repeated pairs of type and name. The return-type section contains exactly one declared return type. A function with no parameters uses an empty parameter list, and a function with no return value uses the explicit no-value type once that spelling is finalized.

A function must be defined before a call to it appears in source order. Argument count and types must match its declaration. Return statements must match the declared return type.

## 6. Expressions

- `cal(...)` represents arithmetic.
- `com(...)` represents comparisons.
- `and(...)`, `or(...)`, and `not(...)` represent boolean operations.

Nested expressions determine grouping. For example:

```text
cal(num(2)+cal(num(3)*num(4)))
```

means (2 + (3 	imes 4)).

The colon `:` is the OneLine division operator. Raw defines it to produce a floating-point result and to raise a runtime error on division by zero. Core may represent other division semantics when required to preserve source-language behavior, but that difference must be explicit and the target compatibility checker must account for it.

## 7. Control flow and code blocks

The established block forms are:
- `flag()[...]`: ordinary top-level execution block.
- `reap(rate)[...]`: recurring block. If no rate is supplied, the initial concept is once per rendered frame; a supplied rate specifies ticks per second.
- `func(...)[...]`: function definition.

Explicit numeric block priorities are removed. Source order controls ordinary execution. The runtime must define how recurring blocks are scheduled, paused, and handled when a tick takes longer than expected.

Conditional syntax is being normalized to the short-token convention. See [SYNTAX.md](SYNTAX.md) for the proposed form.

## 8. Core semantic annotations

When needed for translation, Core should be able to record:
- Source-language numeric behavior, including division, overflow, and precision.
- Whether a conversion is implicit in the source language.
- Error, exception, null, and special numeric-value behavior.
- Evaluation order and short-circuit behavior.
- Runtime or platform requirements.
- Whether an operation can be reproduced directly, with a transformation, or not at all.

These annotations are part of the translator's semantic model, not ordinary user-facing syntax by default. The implementation should use structured data rather than unparsed notes.

## 9. Errors

Core must distinguish syntax errors, static type errors, name-resolution errors, and runtime errors. A translation error is a separate category: valid Core may still be impossible to translate to a particular target without changing behavior.
