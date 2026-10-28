# OneLine Open Decisions and Roadmap

**Status:** Draft, version 0.1

This document separates decisions already established in conversation from proposals that still need confirmation. It prevents a provisional example from accidentally becoming a permanent rule.

## Established decisions

- The project has two forms: **OneLine Core** and **OneLine Raw**.
- Core is the flexible base representation used by the translator.
- Raw is the strict, directly writable form intended to maximize practical portability.
- Syntax should be explicit and translator-friendly; invalid or ambiguous code should error rather than guess.
- Block priority numbers are removed. Source order is the default.
- Functions must be defined before they are called.
- Function parameter types and return types are explicit.
- The colon `:` is the division operator.
- In Raw, division always returns a floating-point result and division by zero is a runtime error.
- A local variable cannot reuse a global variable's name.
- Different functions may reuse the same local variable name.
- A function is defined with `func`, called with `fun`, and reads parameters with `par`.
- Text literals use double quotes inside `txt(...)`.
- The token family includes `glo`, `loc`, `set`, `var`, `val`, `boo`, `nul`, `txt`, `num`, `int`, `flo`, `cal`, `com`, `and`, `or`, and `not`.
- Four-letter block tokens are the intended convention; ordinary built-ins should generally be three letters.

## Proposals requiring a final syntax pass

1. **Identifier spelling:** decide whether identifiers such as function and variable names are bare identifiers or quoted names. Quotation marks should remain reserved for text literals.
2. **Function call grammar:** specify one canonical argument-list form. The function declaration's parameter type/name pairs are established conceptually, but call syntax must match them consistently.
3. **Return token:** use `ret` to follow the three-letter convention, replacing the earlier `return` spelling.
4. **Output token:** use lowercase `say` to follow the convention, replacing earlier `SAY`.
5. **Conditional block:** finalize the four-letter block token and its condition/then/else delimiters.
6. **No-return functions:** decide whether the return type is written as `nul` or another explicit type.
7. **Multiple values:** do not treat adjacent returned values as an implicit list. Define an explicit tuple/collection type if needed.
8. **Argument separators:** define how adjacent expressions are distinguished and validate that the grammar has no ambiguity.
9. **Numeric representation:** fix integer range, floating-point representation, overflow, and rounding rules for Raw.
10. **Boolean evaluation:** confirm short-circuit behavior for `and` and `or`.
11. **Top-level execution:** define how multiple `flag` blocks and recurring `reap` blocks register and execute.
12. **Runtime services:** define what happens when code uses frame-based `reap` in a runtime without frames.

## Recommended implementation roadmap

### Phase 1: Language definition
- Finish the grammar and identifier rules.
- Define the type system, scopes, function calls, returns, and control flow.
- Specify all Raw arithmetic and boolean edge cases.
- Create positive and negative syntax examples.

### Phase 2: OneLine Raw parser
- Parse the documented grammar.
- Produce clear syntax and type errors.
- Enforce declarations, scopes, function order, argument counts, and return types.
- Add automated tests for valid and invalid examples.

### Phase 3: OneLine Core representation
- Define a structured AST/IR independent of source text.
- Add semantic annotations for language-specific behavior.
- Keep source locations for diagnostics.

### Phase 4: First translator prototype
- Select a small subset of one source language and one target language.
- Support only features whose behavior can be verified.
- Generate direct, adapted, blocked, or unverified compatibility reports.
- Add behavior-preservation tests.

### Phase 5: Editor and wider support
- Show diagnostics with actionable explanations.
- Offer automatic transformations only when their behavior is tested.
- Add language adapters gradually.
- Never claim universal portability without evidence.

## Release rule

Do not label the specification stable until the grammar, numeric semantics, function-call form, and control-flow rules are no longer provisional and are covered by tests.
