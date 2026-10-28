# OneLine Syntax Reference

**Status:** Draft, version 0.1. This file proposes normalized syntax where earlier examples conflict. It should be treated as the single reference point for future syntax decisions.

## 1. Delimiters and literals

- `(...)` groups a token's arguments.
- `[...]` encloses a code body for a block construct.
- Double quotes mark text inside `txt(...)`.
- `//` starts a line comment.
- Whitespace and line breaks do not separate statements by themselves.
- Parentheses and punctuation inside quoted text are literal text.

Example:

```text
SAY(txt("Hello (world)!"))
```

The parentheses inside the quoted text do not affect parsing.

## 2. Token lengths

The target convention is:
- Four-letter tokens for block constructs: `flag`, `reap`, `func`, and the proposed conditional block `cond`.
- Three-letter tokens for ordinary operations: `val`, `boo`, `nul`, `txt`, `num`, `int`, `flo`, `par`, `var`, `glo`, `loc`, `set`, `cal`, `com`, `and`, `or`, `not`, `fun`, `ret`, and `say`.

The older spelling `return` is normalized to the proposed three-letter token `ret`. The older uppercase spelling `SAY` is normalized to lowercase `say`. Built-ins are case-sensitive and lowercase. These normalizations are proposed so the language can follow its token-length convention consistently.

## 3. Values

```text
boo(TRUE)
boo(FALSE)
nul()
txt("hello")
int(5)
flo(5.5)
num(1)
num(0.1)
```

`num(1)` infers an integer literal; `num(0.1)` infers a floating-point literal. `int` and `flo` explicitly mark a literal's type. They do not authorize arbitrary implicit conversions.

## 4. Variables

The exact declaration wrapper is being standardized. The proposed form retains the original nested style:

```text
glo(val("total")num(0))
loc(val("step")int(1))
set(val("total")cal(var("total")+var("step")))
SAY(var("total"))
```

Names in these examples are quoted only as a provisional placeholder for the declaration grammar. The final grammar must choose one consistent rule: identifiers as bare names, or identifiers as quoted names. Text values always use `txt("...")`.

Rules:
- A variable must be declared before it is read or assigned.
- A local cannot share a name with a global.
- Separate functions may reuse local names.
- Assignment cannot silently change the declared type.

## 5. Functions

Proposed declaration syntax, matching the requested structure:

```text
func(("double")((num)(x))((int)))[
  ret(cal(num(par(x))*num(2)))
]
```

Interpretation:
- `func` begins a function definition.
- `"double"` is the function name in this provisional example.
- `(num)(x)` declares parameter `x` with type `num`.
- `(int)` declares the return type.
- `[...]` is the function body.
- `par(x)` reads the parameter.
- `ret(...)` returns a value.

A multi-parameter function repeats type-name pairs:

```text
func(("combine")((int)(first)(txt)(second))((txt)))[
  // body to be specified
]
```

A call uses `fun` and must supply exactly the declared number of arguments. Proposed example:

```text
SAY(fun(("double")((int(5)))))
```

This call form is provisional. Before implementation, the grammar must define whether argument values are wrapped directly or placed in a separate argument-list group. The definition, call, and parameter-access tokens must remain distinct: `func`, `fun`, and `par`.

## 6. Arithmetic

`cal(...)` holds an arithmetic expression. Supported operators are `+`, `-`, `*`, `:` for division, and `^` for exponentiation.

```text
cal(num(2)+cal(num(3)*num(4)))
```

Nested `cal` expressions explicitly group operations. Division always returns a floating-point result in Raw. Division by zero is a runtime error in Raw.

## 7. Comparisons and booleans

```text
com(num(5)>=num(3))
and(boo(TRUE)boo(FALSE))
or(boo(TRUE)boo(FALSE))
not(boo(FALSE))
```

The exact separators between multiple arguments are part of the grammar and must be consistent. The current examples use adjacent nested expressions, matching the original language concept.

## 8. Conditional block

Proposed normalized form:

```text
cond(com(var("score")>=int(10))) [
  SAY(txt("Pass"))
] else [
  SAY(txt("Try again"))
]
```

This is a readable sketch, not yet canonical executable syntax. The final grammar must specify how the condition, then-body, and optional else-body are enclosed so that the parser can identify them unambiguously. The intended rule is that the condition must be boolean and both bodies contain statements.

## 9. Top-level and recurring blocks

```text
flag()[
  SAY(txt("Runs in ordinary program flow"))
]

reap(60)[
  SAY(txt("Runs according to a 60-tick-per-second schedule"))
]
```

A `flag` block runs once in source order. A `reap` block registers recurring work. Without a rate, the original intent is once per rendered frame; a non-graphical runtime will need an explicit tick source or must reject frame-dependent behavior.

## 10. Error policy

Malformed or ambiguous code is an error. The parser must not infer missing parentheses, guess identifier names, insert conversions, or change evaluation order silently.

Before implementation, resolve every item labelled provisional in this file. A formal grammar and executable examples should then be used as parser tests.
