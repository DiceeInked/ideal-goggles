# OneLine Raw

See the canonical [OneLine Language Specification](SPECIFICATION.md) and [Formal Grammar](GRAMMAR.md).

OneLine Raw uses the same syntax as Core but applies strict rules intended to make programs predictable and easier to translate. It is a restricted profile, not a separate grammar.

Raw requires explicit variable, parameter, and return types; explicit variable initializers; no implicit conversions between unrelated types; exact argument counts and compatible argument types; one value argument for each `ret(...)`; valid declarations and scope; function definitions before calls; boolean conditions; and defined arithmetic and runtime-error behavior. The `num` type accepts either int or flo, and numeric literal wrappers are not general-purpose casts.

Version 0.2 defines int as signed 64-bit, flo as IEEE 754 binary64, integer overflow as a runtime error, division as always returning flo, and division by zero as a runtime error. and/or short-circuit left-to-right.

Raw aims for broad practical portability, not impossible universal compatibility. The translator must report whether a target can preserve behavior directly, with a verified adaptation, or not at all.

Example:

    func(("double")((num)(x))((num)))[
      ret(cal(par(x)*num(2)));
    ]

    flag()[
      say(fun(("double")((int(5)))));
    ]

In mixed files, Raw code appears inside rawb()[...] regions inside a single mixd()[...] root. See [MIXING.md](MIXING.md).
