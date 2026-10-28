# OneLine Raw Specification

**Status:** Draft, version 0.1  
**Role:** Strict, directly writable language intended to maximize practical portability.

## 1. Design goal

Raw uses explicit types, explicit declarations, defined evaluation rules, and a small set of predictable operations. Its purpose is to make code easier to analyze and translate.

Raw does **not** guarantee that every program can be translated to literally every language or platform. A target may not support a required feature, may have different resource limits, or may not be able to reproduce a behavior. The translator must check this rather than promise universal compatibility.

Raw is not a language that blindly combines every disadvantage from every language. It defines one coherent set of rules designed to avoid ambiguity.

## 2. Required strictness

A Raw implementation must:
- Reject malformed syntax instead of guessing.
- Require variables to be declared before use.
- Reject duplicate names within a prohibited scope.
- Reject a local variable whose name matches a global variable.
- Permit different functions to use the same local name.
- Require function parameter types and return types to be declared.
- Reject mismatched argument counts and types.
- Reject implicit conversions between unrelated types.
- Reject a return value that conflicts with the declared return type.
- Use source order as the default execution order.
- Require a function definition to appear before its call.
- Define arithmetic and boolean behavior consistently.
- Report target incompatibilities before claiming translation success.

## 3. Types

The initial Raw type set is:
- `int`: signed integer with a defined range to be finalized by the language version.
- `flo`: floating-point number with a defined representation and precision to be finalized.
- `num`: a numeric union type that accepts either `int` or `flo` where a numeric value is allowed.
- `txt`: text.
- `boo`: boolean.
- `nul`: null/no-value type.

The literal wrapper `num(1)` infers an integer literal from `1`; `num(0.1)` infers a floating-point literal from `0.1`. An explicit `int(...)` or `flo(...)` requests the corresponding numeric type. Literal inference is not a general implicit conversion rule.

The exact integer range, floating-point format, string encoding, and overflow behavior must be fixed before Raw can promise bit-for-bit portability.

## 4. Arithmetic

The initial arithmetic operators are addition `+`, subtraction `-`, multiplication `*`, division `:`, and exponentiation `^`.

- Arithmetic operands must be numeric.
- Mixing `txt` and numeric values in arithmetic is an error.
- `:` always returns `flo`, even when the mathematical result is a whole number.
- Division by zero produces a defined runtime error.
- Parentheses in the expression structure are represented by nested `cal(...)` expressions.
- Operator precedence and exponentiation associativity must be specified by the parser grammar; until then, nested expressions are the unambiguous form.
- Overflow, floating-point precision, NaN, and infinity behavior must be defined by a future Raw version. The translator must not silently assume target defaults are identical.

Example:

```text
cal(num(2)+cal(num(3)*num(4)))
```

This evaluates as (2 + (3 	imes 4)).

## 5. Comparisons and booleans

`com(...)` performs one comparison using `==`, `!=`, `>=`, `<=`, `>`, or `<`, and returns `boo`.

`and(...)`, `or(...)`, and `not(...)` operate on boolean values only. Whether `and` and `or` short-circuit must be a language-level rule, not inherited accidentally from the target language. The initial recommendation is to define both as short-circuiting, left-to-right operators.

## 6. Variables and scopes

- `glo(...)` declares a global.
- `loc(...)` declares a local.
- `set(...)` changes an existing variable.
- `var(...)` reads a variable.
- `par(...)` reads a function parameter.

Variables must be declared before use. A local may not have the same name as a global. Two functions may use the same local name because their local scopes are independent. Re-declaring a name in the same scope is an error.

Assignment does not silently change a variable's declared type. A value assigned to a variable must be compatible with that variable's declared type.

## 7. Functions and return values

A function declaration uses `func`, a call uses `fun`, and parameter access uses `par`.

```text
func(("double")((num)(x))((int)))[
  return(cal(num(par(x))*num(2)))
]

SAY(fun(("double")((int(5)))))
```

The declaration specifies the function name, a parameter named `x` of type `num`, and return type `int`. The call must provide exactly one compatible argument.

A function has one declared return value. To return several related values, define an explicit aggregate/tuple type in a future version or return one declared collection type. Raw does not treat several adjacent values as an implicit list.

The exact final call syntax and the behavior of a no-return function still need to be finalized in the grammar. This example documents the intended separation between definition, call, parameter read, and return type.

## 8. Output

`SAY(...)` is the current proposed console-output operation. Its final token spelling is subject to the short-token convention pass. Output is an external effect and may require a target-specific adapter; a target with no console must report that requirement.

## 9. Code blocks and execution

- `flag()[...]` runs its contained top-level statements once as ordinary program flow.
- `reap(rate)[...]` registers recurring work at the specified tick rate. Without a rate, the initial concept is once per rendered frame; this requires a runtime that has a frame/tick source.
- `func(...)[...]` declares a function.
- Source order controls ordinary execution. There are no numeric block priorities.
- Functions must be defined before their calls appear.
- The exact interaction between top-level blocks and recurring blocks must be specified by the runtime before a conforming implementation is released.

## 10. Conditional execution

Raw needs a conditional block with a boolean condition and explicit then/else bodies. The proposed normalized form is shown in [SYNTAX.md](SYNTAX.md). The condition must evaluate to `boo`; truthiness conversions are not permitted.

## 11. Runtime errors

At minimum, the runtime must define errors for division by zero, invalid operations, missing runtime services, and other conditions required by the final type and arithmetic specification. The language must distinguish a compile/translation-time diagnostic from a runtime failure.

## 12. Portability contract

Raw promises only that its specified semantics are stable and that the translator will check a target against those semantics. It does not promise that every target can run every program.

The compatibility checker should report:
- **Direct:** no semantic adaptation is required.
- **Adapted:** generated helper code or a supported runtime adapter preserves behavior.
- **Blocked:** the target cannot preserve behavior under current rules.
- **Needs confirmation:** equivalence cannot be established automatically.

A blocked translation must not be labelled successful.
