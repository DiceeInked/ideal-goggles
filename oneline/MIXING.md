# Mixing OneLine Core and OneLine Raw

Mixed mode is defined in SPECIFICATION.md.

A mixed file contains exactly one outer mixd()[...] block. Its body contains one or more explicitly marked, non-nested regions:

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

- rawb()[...] applies Raw's strict profile.
- core()[...] applies Core's flexible profile.
- Regions cannot nest.
- All executable code must belong to exactly one region.
- Code outside the mixd root is invalid in a mixed file.
- Cross-region calls require explicit compatible signatures and supported boundary types.
- Version 0.2 allows only int, flo, num, txt, boo, and nul across Raw boundaries. Tuples and custom Core types cannot cross a Raw boundary.
- A Raw region cannot silently rely on a Core-only behavior.

The translator checks each region under its own profile, validates interfaces, then combines them into one intermediate representation. If any required part is blocked or unverified, the editor must say so instead of claiming successful translation.
