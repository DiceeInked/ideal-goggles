# OneLine Core

See the canonical [OneLine Language Specification](SPECIFICATION.md) and [Formal Grammar](GRAMMAR.md).

OneLine Core is the flexible, general-purpose form of OneLine. It has near-zero restrictions imposed specifically for portability and does not automatically inherit Raw's strict profile. It still requires valid syntax and defined or explicitly annotated semantics.

Core can represent dynamic or explicit types, richer values such as tuples, source-specific arithmetic and conversion behavior, custom runtime operations, and platform-specific features. Flexibility does not permit the translator to guess what an unknown operation means.

Example:

    func(("double")((num)(x))((int)))[
      ret(cal(num(par(x))*num(2)));
    ]

    flag()[
      say(fun(("double")((int(5)))));
    ]

Core is also the translator's semantic foundation. Its structured representation should preserve types, evaluation order, numeric edge cases, errors, runtime requirements, and other behavior that could affect translation.

In mixed files, Core code appears inside core()[...] regions within a single mixd()[...] root. Cross-region calls require explicit compatible interfaces. See [MIXING.md](MIXING.md).
