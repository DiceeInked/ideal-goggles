# OneLine Language Specification

Version 0.2 design baseline. This is the canonical design document for OneLine Core, OneLine Raw, and mixed-mode programs. Implementation and conformance testing remain future work.

## 1. Language model

OneLine has one shared syntax and three compilation modes.

**OneLine Core** is the flexible, general-purpose form. It has near-zero restrictions imposed specifically for portability. It still requires valid syntax and defined or explicitly annotated semantics.

**OneLine Raw** uses the same syntax under a strict profile intended to maximize practical portability. Raw defines explicit types, conversions, numeric behavior, returns, scopes, and error behavior.

**Mixed OneLine** lets a file mark individual code regions as Core or Raw. Each statement has exactly one active profile.

Core and Raw are not separate parsers or unrelated languages. A parser builds one structured syntax tree; the selected profile determines which semantic rules apply.

Raw cannot guarantee every program will run on every language or platform. A target may lack required capabilities or be unable to reproduce a behavior. The translator must report that honestly.

## 2. Lexical rules

- Built-in tokens are lowercase and case-sensitive.
- Identifiers use ASCII in version 0.2 and match [A-Za-z_][A-Za-z0-9_]*. Identifiers are case-sensitive.
- Function names are double-quoted strings in the function declaration and call syntax. Variable and parameter names are bare identifiers.
- Boolean literal spellings are exactly TRUE and FALSE.
- Integer literals are decimal whole numbers. Floating-point literals contain a decimal point, such as 0.1; an exponent may follow a decimal floating-point literal, for example 1.25e-3. Numeric wrappers accept unsigned literals only; write negative numeric values with unary signs inside `cal(...)`, for example `cal(-int(5))`.
- Text is written as txt("text"). Text literals cannot contain an unescaped double quote, backslash, or raw line break. The only supported escapes are `\\` for a backslash, `\"` for a double quote, `\n` for a newline, `\r` for a carriage return, and `\t` for a tab. Unknown escapes are errors. Other Unicode text characters are allowed.
- // begins a comment that ends at the line break.
- Whitespace and line breaks are ignored except inside text literals and comments.
- Semicolons terminate every simple statement and are required after every simple statement, including the final simple statement before a closing square bracket. Self-delimiting blocks and conditionals do not take a trailing semicolon.
- Parentheses and punctuation inside a quoted text literal are text, not syntax.
- Documentation placeholders such as /NAME/ are not source code.

## 3. Token convention

The intended naming convention is three letters for ordinary built-ins and four letters for block constructs. AND and OR are written as lowercase and and or.

| Token | Meaning |
|---|---|
| val | General value wrapper; semantically transparent |
| boo | Boolean literal |
| nul | Null/no-value |
| txt | Text literal |
| num | Numeric literal inference / numeric union type |
| int | Integer literal/type |
| flo | Floating-point literal/type |
| glo | Global declaration |
| loc | Local declaration |
| set | Assignment to an existing variable |
| var | Variable read |
| par | Parameter read |
| cal | Arithmetic expression |
| com | Comparison |
| and, or, not | Boolean operations |
| tup | Tuple value, Core-only in version 0.2 |
| func | Function definition block |
| fun | Function call |
| ret | Return from function |
| say | Output through the configured output service |
| flag | One-time execution block |
| reap | Recurring execution block |
| cond | Conditional block |
| else | Optional conditional alternative |
| mixd | Root block for a mixed-mode file |
| core | Core-profile region in a mixed file |
| rawb | Raw-profile region in a mixed file |

The older spellings return and uppercase SAY are not canonical in version 0.2; use ret and say. Built-ins are lowercase. TRUE and FALSE are the only uppercase reserved literal spellings.

## 4. Values and types

Built-in types are int, flo, num, txt, boo, and nul.

- int(5): integer literal.
- flo(5.5): floating-point literal.
- num(1): numeric literal inferred as int from its spelling.
- num(0.1): numeric literal inferred as flo from its spelling.
- The type `num` is a tagged numeric union that can hold either an int or a flo value. The `num(...)` literal constructor accepts a numeric literal only; it is not a general cast or conversion.
- txt("hello"): text.
- boo(TRUE) and boo(FALSE): booleans.
- nul(): null/no-value.
- var(score): read variable score.
- par(x): read parameter x.
- tup(...): tuple value available in Core only in version 0.2.

The val(value) wrapper evaluates to the same value and type as value. A bare parenthesized value expression is a grouping/value wrapper with the same meaning as val(value).

Core supports tuples in version 0.2 and may use compiler- or host-defined custom types when those types are registered with the semantic model. Version 0.2 does not define syntax for declaring new types or for untyped variables. Function parameters and return types remain explicit in both profiles. Core flexibility does not excuse unknown operations or undefined behavior: a used operation must have defined semantics or explicit metadata.

## 5. Variables and scope

Canonical declarations:

    glo((int)(total)int(0));
    loc((int)(step)int(1));
    set((total)cal(var(total)+var(step)));
    say(var(total));

A declaration supplies type, identifier, and initial value. Raw requires explicit types and initializers. Initializers and later assignments must be compatible with the declared type; `num` accepts either `int` or `flo` as a member of its union. Assignment never changes the declared variable type.

Scope rules:
- A local variable cannot reuse a global variable's name.
- Different functions may reuse the same local name.
- A name cannot be declared twice in the same scope.
- Reads must resolve to a declared variable or current function parameter.
- Functions must be defined before their calls appear in source order.

Version 0.2 requires an initializer in both profiles; there is no uninitialized-declaration syntax. Core may define richer initializer semantics through its semantic model, but the source form must still contain an initializer.

## 6. Functions

Canonical declaration and call:

    func(("double")((num)(x))((num)))[
      ret(cal(par(x)*num(2)));
    ]

    flag()[
      say(fun(("double")((int(5)))));
    ]

Structure:
- func defines a function.
- The quoted string is the function name. Names are compared after escape decoding and are case-sensitive. Function names must be unique within a program; overloading is not defined in version 0.2.
- Each parameter is a repeated type-name pair, such as (num)(x).
- The final type group declares the return type.
- fun calls a function.
- Each call argument is wrapped in its own parentheses inside the argument list.
- par reads a parameter.
- ret returns a value.

Multiple parameters repeat type-name pairs, for example func(("combine")((int)(first)(txt)(second))((txt)))[...]. A `num` parameter accepts either int or flo values, and a `num` return type can return either. Zero-parameter calls use an empty argument group: fun(("name")()).

The return type is explicit in both profiles. `ret(...)` always has one value argument; use `ret(nul())` to explicitly return no-value. A function declared with return type `nul` may also finish without an explicit `ret`. A Raw function with any other return type must return a compatible value on every reachable path. Core can return a tuple with ret(tup(value1 value2)) when the Core type checker accepts it. `ret` is legal only inside a function body, never inside `flag` or `reap` bodies.

Argument count, parameter types, return types, and function-definition order are checked before translation. Calls to unknown or not-yet-defined functions are errors.

## 7. Arithmetic

cal(...) contains arithmetic. Operators are +, -, *, : for division, and ^ for exponentiation.

Example:

    cal(num(2)+cal(num(3)*num(4)))

This evaluates to 14. Nested cal calls group expressions.

Raw operator precedence, highest to lowest:
1. Parenthesized/grouped expressions.
2. Exponentiation, right-associative.
3. Unary sign.
4. Multiplication and division.
5. Addition and subtraction.

Raw numeric model in version 0.2:
- int is signed 64-bit.
- flo is IEEE 754 binary64.
- Integer overflow is a runtime error, not silent wrapping.
- Integer `+`, `-`, and `*` produce int and raise a runtime error on signed 64-bit overflow.
- If both exponent operands are int and the exponent is a nonnegative integer, `^` produces int and raises a runtime error on overflow. If either operand is flo or the exponent is negative, `^` produces flo.
- Mixed int/flo arithmetic produces flo.
- Division always produces flo, even if the result is a whole number.
- Division by zero raises a runtime error when the expression is evaluated, including when the divisor is a literal zero.
- Floating-point NaN and infinity are supported when produced by defined non-division operations; Raw division by zero remains an error.
- and and or short-circuit left-to-right.

Core does not force source-specific arithmetic into Raw's behavior. Core records the operation's meaning in its semantic representation so the translator can preserve it or report a compatibility issue.

## 8. Comparisons and boolean operations

Comparison syntax:

    com(num(5)>=num(3))
    com(var(score)==int(10))

Supported operators are ==, !=, >=, <=, >, and <. The result is boo. Raw requires comparable operand types and does not convert unrelated values implicitly. Equality and inequality are defined for same-type values and for numeric int/flo pairs; mixed numeric comparisons promote int to flo. Ordering comparisons are defined for numeric values only. Text equality compares the exact text sequence, boolean equality compares boolean values, and nul equals only nul. Floating-point comparisons follow IEEE 754 behavior, including NaN comparison rules.

Boolean syntax:

    and(boo(TRUE)boo(FALSE))
    or(boo(TRUE)boo(FALSE))
    not(boo(FALSE))

Boolean operations accept only boolean values in Raw. There is no truthiness conversion. Raw and and or short-circuit left-to-right.

## 9. Output and conditions

    cond(com(var(score)>=int(10)))[
      say(txt("Pass"));
    ] else [
      say(txt("Try again"));
    ]

The condition must evaluate to boo in both profiles; OneLine does not use implicit truthiness for conditionals. else is allowed only immediately after the then-body. say(value) sends output through a configured console/output service. If a target lacks an equivalent service, the translator must require an adapter or report incompatibility.

## 10. Execution blocks and ordering

- flag()[...] executes once in ordinary program flow.
- reap()[...] schedules recurring work once per rendered frame in a runtime that provides frames.
- reap(rate)[...] schedules recurring work at the specified positive tick rate. The rate expression must evaluate to a positive integer when the block registers; invalid rates are runtime errors. The rate is measured in ticks per second.
- func(...)[...] defines a function.
- cond(...)[...] defines conditional flow.

Numeric block priority labels have been removed. Top-level items are processed in source order: function definitions register their signatures but do not execute their bodies; `flag` blocks run once when reached; `reap` blocks register when reached and then run on the runtime scheduler without blocking ordinary execution. A function signature is registered before its body is checked, so self-recursion is allowed; calls to later definitions are errors. A no-rate `reap` requires a frame source. A Raw target without that service must report the requirement rather than silently invent a clock.

## 11. Mixed Core/Raw programs

A mixed file must contain exactly one mixd()[...] root. Its body contains one or more explicitly marked regions:

    mixd()[
      rawb()[
        flag()[
          say(txt("This region follows Raw rules"));
        ]
      ]
      core()[
        flag()[
          // Flexible Core code goes here.
        ]
      ]
    ]

Rules:
- Only rawb()[...] and core()[...] are allowed directly inside mixd.
- Regions cannot nest.
- Every executable statement belongs to exactly one region.
- Code outside the outer mixd block is an error in a mixed file.
- A Raw region cannot silently depend on Core-only behavior.
- Cross-region calls require explicit, compatible interfaces.
- In version 0.2, only int, flo, num, txt, boo, and nul may cross a Raw boundary. Tuples and custom Core types cannot cross that boundary. Function names are program-wide and unique; a cross-region call may target an earlier function definition in another region through ordinary `fun(...)` syntax, but its explicit signature and all argument/return types must satisfy these boundary rules. Forward calls remain errors.

A regular Core file uses Core throughout. A regular Raw file uses Raw throughout. Only mixed files use mixd.

## 12. Statement and block rules

- Every simple statement must end with a semicolon.
- A semicolon is required after every simple statement, including the final simple statement before a closing square bracket.
- Newlines do not separate statements.
- Function definitions, conditionals, and block constructs are self-delimiting.
- Empty statements are invalid.
- Every executable statement must be inside a code block.
- `ret` is valid only inside a function body.
- Extra tokens after a complete program are an error.

## 13. Error categories

The implementation distinguishes lexical and syntax errors, name-resolution and declaration errors, type/profile errors, runtime errors, and translation compatibility warnings or failures.

Diagnostics include source location, explanation, and a safe suggested fix when one is determinable. The parser must not guess missing delimiters, insert conversions, invent declarations, or silently alter evaluation order.

## 14. Translation compatibility

For each target, the translator reports:
- Direct: the target preserves the behavior without adaptation.
- Adapted: tested generated code or a supported runtime adapter preserves behavior.
- Blocked: the target cannot preserve behavior under current support.
- Unverified: equivalence cannot be established reliably.

The translator checks semantics, not just token names. If source and target behavior already match, it should not create an unnecessary roadblock. A successful parse does not guarantee that every target can run the program.

## 15. Implementation conformance

Version 0.2 is a design baseline, not yet a stable release. A conforming implementation must parse the grammar, enforce Raw rules, validate mixed-region boundaries, and pass automated positive and negative tests. See CONFORMANCE.md.
