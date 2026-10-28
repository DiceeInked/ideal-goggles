# OneLine Formal Grammar

The canonical syntax and semantics are defined in [SPECIFICATION.md](SPECIFICATION.md). This file summarizes the parser structure.

## Lexical tokens

    Letter        = "A"..."Z" | "a"..."z" ;
    Digit         = "0"..."9" ;
    Identifier    = (Letter | "_"), { Letter | Digit | "_" } ;
    StringLiteral = double-quote, { Character | Escape }, double-quote ;
    Escape        = backslash | escaped-quote | newline | carriage-return | tab ;
    Boolean       = "TRUE" | "FALSE" ;
    BuiltinType   = "int" | "flo" | "num" | "txt" | "boo" | "nul" ;
    Type          = BuiltinType | Identifier | TupleType ;
    TupleType     = "tup" "(" TypeList? ")" ;
    TypeList      = Type, { Type } ;
    Exponent      = ("e" | "E"), [ "+" | "-" ], Digit, { Digit } ;
    IntegerLiteral = Digit, { Digit } ;
    FloatLiteral   = Digit, { Digit }, ".", Digit, { Digit }, [ Exponent ] ;
    NumberLiteral  = IntegerLiteral | FloatLiteral ;

Identifiers are ASCII and case-sensitive in version 0.2. Built-ins are lowercase. Whitespace is ignored outside strings and comments. A // comment ends at a line break. Semicolons terminate simple statements. Text literals cannot contain an unescaped quote, backslash, or raw line break. Supported escape spellings are `\\`, `\"`, `\n`, `\r`, and `\t`; unknown escapes are errors. In this EBNF, the notation A...Z means any character in that inclusive range. `Character` in the string rule means any Unicode scalar value other than an unescaped double quote, backslash, carriage return, or line feed. The names used for escape alternatives correspond exactly to the five spellings listed above.

## Compilation unit

    Program          = TopLevelItem* | MixedProgram ;
    TopLevelItem     = FunctionDefinition | ExecutionBlock ;
    ExecutionBlock   = FlagBlock | ReapBlock ;
    FlagBlock        = "flag" "()" "[" BodyStatement* "]" ;
    ReapBlock        = "reap" "(" Rate? ")" "[" BodyStatement* "]" ;
    Rate             = Value ;

A regular Core or Raw file contains top-level function definitions and execution blocks. Bare executable statements are not allowed at the top level. A mixed file is instead exactly one MixedProgram and cannot contain material before or after it. A file must be either a regular program or a mixed program, never both.

## Statements inside bodies

    BodyStatement    = Declaration ";"
                     | Assignment ";"
                     | Output ";"
                     | Return ";"
                     | Expression ";"
                     | Conditional ;

    Declaration      = "glo" "(" "(" Type ")" "(" Identifier ")" Value ")"
                     | "loc" "(" "(" Type ")" "(" Identifier ")" Value ")" ;
    Assignment       = "set" "(" "(" Identifier ")" Value ")" ;
    Output           = "say" "(" Value ")" ;
    Return           = "ret" "(" Value ")" ;
    VariableRead     = "var" "(" Identifier ")" ;
    ParameterRead    = "par" "(" Identifier ")" ;

Every simple statement must end with a semicolon, including the final simple statement before a closing bracket. Self-delimiting conditionals and blocks do not take a trailing semicolon. Newlines alone never separate statements. Function definitions and execution blocks are top-level items, not body statements. Function definitions cannot be nested. `ret` is parsed as a body statement but is semantically valid only inside a function body.

## Values and operations

    Literal          = "boo" "(" Boolean ")"
                     | "nul" "()"
                     | "txt" "(" StringLiteral ")"
                     | "int" "(" IntegerLiteral ")"
                     | "flo" "(" FloatLiteral ")"
                     | "num" "(" NumberLiteral ")" ;
    Value            = Literal
                     | "val" "(" Value ")"
                     | "(" Value ")"
                     | VariableRead
                     | ParameterRead
                     | FunctionCall
                     | Arithmetic
                     | Comparison
                     | BooleanOperation
                     | TupleValue ;
    Expression       = Value ;
    TupleValue       = "tup" "(" ValueList? ")" ;
    ValueList        = Value, { Value } ;
    Comparison       = "com" "(" Value CompareOperator Value ")" ;
    CompareOperator  = "==" | "!=" | ">=" | "<=" | ">" | "<" ;
    BooleanOperation = "and" "(" Value Value ")"
                     | "or" "(" Value Value ")"
                     | "not" "(" Value ")" ;
    Arithmetic       = "cal" "(" NumericExpression ")" ;
    NumericValue     = "int" "(" IntegerLiteral ")"
                     | "flo" "(" FloatLiteral ")"
                     | "num" "(" NumberLiteral ")" ;

val(value) and a bare parenthesized value are transparent wrappers: they preserve the wrapped value and type. Tuples are Core-only in version 0.2. The `num` type is a tagged union of int and flo; `num(...)` itself accepts a numeric literal only and infers its member type from the literal spelling.

## Arithmetic precedence

    NumericExpression = Sum ;
    Sum               = Product, { ("+" | "-"), Product } ;
    Product           = Unary, { ("*" | ":"), Unary } ;
    Unary             = ("+" | "-"), Unary | Power ;
    Power             = Atom, [ "^", Unary ] ;
    Atom              = NumericValue | VariableRead | ParameterRead | FunctionCall
                      | Arithmetic | "(" NumericExpression ")" ;

Exponentiation is right-associative. Precedence from highest to lowest is grouping, exponentiation, unary sign, multiplication/division, addition/subtraction. Numeric wrappers accept unsigned literals; negative values are written with the unary sign inside `cal(...)`. The colon is division.

## Functions

    FunctionDefinition = "func" "(" "(" StringLiteral ")" "(" ParameterList? ")" "(" Type ")" ")" "[" BodyStatement* "]" ;
    Parameter          = "(" Type ")" "(" Identifier ")" ;
    ParameterList      = Parameter, { Parameter } ;
    FunctionCall       = "fun" "(" "(" StringLiteral ")" "(" ArgumentList? ")" ")" ;
    Argument           = "(" Value ")" ;
    ArgumentList       = Argument, { Argument } ;

Example:

    func(("double")((num)(x))((num)))[
      ret(cal(par(x)*num(2)));
    ]

    flag()[
      say(fun(("double")((int(5)))));
    ]

Function names are quoted. Variable and parameter names are bare identifiers. Function definitions must precede calls. Each argument is wrapped in its own parentheses inside the argument list. A zero-argument call uses an empty argument group.

## Conditions and mixed mode

    Conditional   = "cond" "(" Value ")" "[" BodyStatement* "]"
                    [ "else" "[" BodyStatement* "]" ] ;
    MixedProgram  = "mixd" "()" "[" Region+ "]" ;
    Region        = "core" "()" "[" TopLevelItem* "]"
                  | "rawb" "()" "[" TopLevelItem* "]" ;

A condition must evaluate to boo in both profiles. A mixed file has exactly one outer mixd root; its direct children are non-nested core or rawb regions only. Every top-level item belongs to exactly one region. Core may use tuple types and host-registered custom types where defined. Version 0.2 defines no source syntax for custom type declarations. Raw profile validation restricts types to the six built-in types.

## Parser obligations

Implement explicit operator precedence and associativity, not naive string splitting. Reject missing separators, unknown tokens, mismatched delimiters, invalid type forms, nested function definitions, `ret` outside a function, bare top-level statements, and trailing tokens. Preserve source spans for diagnostics. The parser must not invent declarations or conversions.
