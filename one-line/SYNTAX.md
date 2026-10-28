# OneLine Syntax Reference

The canonical syntax and semantics are defined in [SPECIFICATION.md](SPECIFICATION.md). Parser details are summarized in [GRAMMAR.md](GRAMMAR.md).

## Literals

    boo(TRUE)
    boo(FALSE)
    nul()
    txt("Hello (world)!")
    int(5)
    flo(5.5)
    num(1)
    num(0.1)

## Variables

    glo((int)(total)int(0));
    loc((int)(step)int(1));
    set((total)cal(var(total)+var(step)));
    say(var(total));

## Functions

    func(("double")((num)(x))((num)))[
      ret(cal(par(x)*num(2)));
    ]

    flag()[
      say(fun(("double")((int(5)))));
    ]

## Arithmetic and comparisons

    cal(int(2)+cal(int(3)*int(4)))
    com(var(score)>=int(10))
    and(boo(TRUE)boo(FALSE))
    or(boo(TRUE)boo(FALSE))
    not(boo(FALSE))

`cal(...)` supports `+`, `-`, `*`, `:` (division), and `^` (exponentiation). Nested `cal(...)` calls group expressions. Negative values use unary signs, such as `cal(-int(5))`. Raw division always returns `flo`; division by zero is a runtime error.

## Conditions

    cond(com(var(score)>=int(10)))[
      say(txt("Pass"));
    ] else [
      say(txt("Try again"));
    ]

## Mixed mode

    mixd()[
      rawb()[
        flag()[
          say(txt("Strict Raw region"));
        ]
      ]
      core()[
        flag()[
          say(txt("Flexible Core region"));
        ]
      ]
    ]

Semicolons terminate simple statements; line breaks do not. Built-ins are lowercase and case-sensitive. Text is quoted inside txt(...). Function names are quoted; variable and parameter names are bare identifiers. Invalid or ambiguous code is an error, never an invitation for the parser to guess.
