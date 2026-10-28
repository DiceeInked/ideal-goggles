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

    func(("double")((num)(x))((int)))[
      ret(cal(num(par(x))*num(2)));
    ]

    flag()[
      say(fun(("double")((int(5)))));
    ]

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

Semicolons separate simple statements; line breaks do not. Built-ins are lowercase and case-sensitive. Text is quoted inside txt(...). Function names are quoted; variable and parameter names are bare identifiers. Invalid or ambiguous code is an error, never an invitation for the parser to guess.
