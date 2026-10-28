# OneLine Conformance Tests

These tests describe expected behavior for a future implementation. They have not yet been run against a compiler.

## Valid Raw examples

### Output and literals

    flag()[
      say(txt("Hello (world)!"));
      say(num(1));
      say(num(0.1));
    ]

### Variables

    flag()[
      loc((int)(count)int(2));
      set((count)cal(var(count)+int(3)));
      say(var(count));
    ]

### Functions

    func(("double")((num)(x))((num)))[
      ret(cal(par(x)*num(2)));
    ]

    flag()[
      say(fun(("double")((int(5)))));
    ]

### Conditional

    flag()[
      loc((int)(score)int(12));
      cond(com(var(score)>=int(10)))[
        say(txt("Pass"));
      ] else [
        say(txt("Try again"));
      ]
    ]

### Mixed file

    mixd()[
      rawb()[
        flag()[
          say(txt("Raw region"));
        ]
      ]
      core()[
        flag()[
          say(txt("Core region"));
        ]
      ]
    ]

## Must be rejected in Raw

1. Two simple statements without a semicolon between them.
2. Assigning text to an integer variable without a compatible type.
3. Reading an undeclared variable.
4. Declaring the same name twice in one scope.
5. Giving a local variable the same name as a global.
6. Calling a function with the wrong argument count or an incompatible argument type.
7. Returning a value incompatible with the declared return type.
8. Calling a function before its definition.
9. Using a non-boolean value as a condition.
10. Nesting a core or rawb region inside another region.
11. Using unknown built-ins, malformed strings or escapes, mismatched delimiters, or trailing tokens.
12. Using `ret` outside a function or writing `ret()` without a value.

## Runtime tests

- 8 : 2 returns a flo value representing 4.
- The expression `cal(int(2)+cal(int(3)*int(4)))` evaluates to int 14.
- Division by zero, including a literal-zero denominator, raises a runtime error when the expression is evaluated.
- Integer overflow raises a runtime error rather than wrapping.
- and and or short-circuit left-to-right.
- Every reachable path in a value-returning Raw function returns a compatible value.
- A nul function can finish without a value.
- A tuple or unsupported Core type cannot cross a Raw boundary in version 0.2.

Every parser/runtime release should run these tests automatically. Update the tests whenever the grammar or semantics change.
