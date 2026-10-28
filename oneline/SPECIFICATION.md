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
- Integer literals are decimal whole numbers. Floating-point literals contain a decimal point, such as 0.1; exponent notation is allowed.
- Text is written as txt("text"). Supported escapes are backslash, escaped double quote, newline, carriage return, and tab. Unknown escapes are errors.
- // begins a comment that ends at the line break.
- Whitespace and line breaks are ignored except inside text literals and comments.
- Semicolons separate simple statements. A final semicolon before a closing square bracket is optional.
- Parentheses and punctuation inside a quoted text literal are text, not syntax.
- Documentation placeholders such as /NAME/ are not source code.

## 3. Token convention

The intended naming convention is three letters for ordinary built-ins and four letters for block constructs. AND and OR are written as lowercase and and or.

| Token | Meaning |
|---|---|
| val | General value wrapper retained for compatibility with the original concept |
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
- num(1): numeric literal inferred as integer from its spelling.
- num(0.1): numeric literal inferred as floating-point from its spelling.
- txt("hello"): text.
- boo(TRUE) and boo(FALSE): booleans.
- nul(): null/no-value.
- var(score): read variable score.
- par(x): read parameter x.
- tup(...): tuple value available in Core only in version 0.2.

In Raw, num is a tagged numeric union that holds either an int or a flo. Literal inference is not a general conversion function. int and flo do not silently convert arbitrary values.

Core may support dynamic values, optional type annotations, tuples, richer return values, custom types, and source-specific semantics when the compiler's semantic representation defines them. Core flexibility does not excuse unknown operations or undefined behavior: a used operation must have defined semantics or explicit metadata.

## 5. Variables and scope

Canonical declarations:

    glo((int)(total)int(0));
    loc((int)(step)int(1));
    set((total)cal(var(total)+var(step)));
    say(var(total));

A declaration supplies type, identifier, and initial value. Raw requires explicit types and initializers. The initializer must match the declared type. Assignment updates an existing variable and does not change its type.

Scope rules:
- A local variable cannot reuse a global variable's name.
- Different functions may reuse the same local name.
- A name cannot be declared twice in the same scope.
- Reads must resolve to a declared variable or current function parameter.
- Functions must be defined before their calls appear in source order.

Core may represent an explicitly uninitialized or dynamic variable if the implementation defines its behavior. Raw does not permit uninitialized declarations in version 0.2.

## 6. Functions

Canonical declaration and call:

    func(("double")((num)(x))((int)))[
      ret(cal(num(par(x))*num(2)));
    ]

    flag()[
      say(fun(("double")((int(5)))));
    ]

Structure:
- func defines a function.
- The quoted string is the function name.
- Each parameter is a repeated type-name pair, such as (num)(x).
- The final type group declares the return type.
- fun calls a function.
- Each call argument is wrapped in its own parentheses inside the argument list.
- par reads a parameter.
- ret returns a value.

Multiple parameters repeat type-name pairs, for example func(("combine")((int)(first)(txt)(second))((txt)))[...]. Zero-parameter calls use an empty argument group: fun(("name")()).

The return type is explicit in both profiles. Raw functions return exactly one value of the declared type or use nul for no value. A Raw value-returning function must return on every reachable path. Core can return a tuple with ret(tup(value1 value2)) when the Core type checker accepts it.

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
- Mixed integer/floating-point arithmetic produces flo.
- Division always produces flo, even if the result is a whole number.
- Division by zero is a runtime error.
- Floating-point NaN and infinity are supported when produced by defined non-division operations; Raw division by zero remains an error.
- and and or short-circuit left-to-right.

Core does not force source-specific arithmetic into Raw's behavior. Core records the operation's meaning in its semantic representation so the translator can preserve it or report a compatibility issue.

## 8. Comparisons and boolean operations

Comparison syntax:

    com(num(5)>=num(3))
    com(var(score)==int(10))

Supported operators are ==, !=, >=, <=, >, and <. The result is boo. Raw requires comparable operand types and does not convert unrelated values implicitly.

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

The condition must evaluate to boo. else is allowed only immediately after the then-body. say(value) sends output through a configured console/output service. If a target lacks an equivalent service, the translator must require an adapter or report incompatibility.

## 10. Execution blocks and ordering

- flag()[...] executes once in ordinary program flow.
- reap()[...] schedules recurring work once per rendered frame in a runtime that provides frames.
- reap(rate)[...] schedules recurring work at the specified positive tick rate.
- func(...)[...] defines a function.
- cond(...)[...] defines conditional flow.

Numeric block priority labels have been removed. Ordinary execution follows source order. Recurring blocks register in source order and are then scheduled by the runtime; they do not block ordinary execution. A no-rate reap requires a frame source. A Raw target without that service must report the requirement rather than silently invent a clock.

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
- In version 0.2, only int, flo, num, txt, boo, and nul may cross a Raw boundary. Tuples and custom Core types cannot cross that boundary.

A regular Core file uses Core throughout. A regular Raw file uses Raw throughout. Only mixed files use mixd.

## 12. Statement and block rules

- Every simple statement must end with a semicolon.
- A semicolon immediately before a closing square bracket is optional.
- Newlines do not separate statements.
- Function definitions, conditionals, and block constructs are self-delimiting.
- Empty statements are invalid.
- Every executable statement must be inside a code block.
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
