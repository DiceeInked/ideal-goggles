# OneLine Language Overview

See the canonical [OneLine Language Specification](SPECIFICATION.md) for the authoritative syntax and semantics.

OneLine has two profiles over a shared grammar:

- **Core:** the flexible, general-purpose language. It does not inherit Raw's portability restrictions, but still requires valid syntax and defined or explicitly annotated behavior.
- **Raw:** a strict profile with explicit types, no implicit conversions between unrelated types, defined numeric rules, and strict scope and return checks.
- **Mixed:** one file can explicitly mark regions as Core or Raw.

A mixed file uses one outer structure:

    mixd()[
      rawb()[
        flag()[
          say(txt("Portable region"));
        ]
      ]
      core()[
        flag()[
          // Flexible region
        ]
      ]
    ]

The parser is shared; profile validation determines which rules apply. Cross-region calls require explicit compatible interfaces.

Whitespace and line breaks are for readability, not statement separation. Semicolons terminate simple statements. Built-ins are lowercase and case-sensitive; text is quoted inside txt(...). Ordinary operations use three-letter tokens, while block constructs use four-letter tokens, with and/or as boolean operators.

The translator checks semantics rather than merely replacing syntax. It reports Direct, Adapted, Blocked, or Unverified outcomes. Raw aims for practical portability, not a guarantee that every target can execute every program.

**Status:** Version 0.2 design baseline; implementation and conformance testing remain future work.
