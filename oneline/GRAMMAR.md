# OneLine Formal Grammar

The canonical syntax and semantics are defined in [SPECIFICATION.md](SPECIFICATION.md). This file summarizes the parser structure.

## Lexical tokens

    Letter        = "A"..."Z" | "a"..."z" | "_" ;
    Digit         = "0"..."9" ;
    Identifier    = Letter, { Letter | Digit } ;
    StringLiteral = double-quote, { Character | Escape }, double-quote ;
    Escape        = backslash | escaped-quote | newline | carriage-return | tab ;
    Boolean       = "TRUE" | "FALSE" ;
    Type          = "int" | "flo" | "num" | "txt" | "boo" | "nul" ;
    Exponent      = ("e" | "E"), [ "+" | "-" ], Digit, { Digit } ;
    IntegerLiteral = Digit, { Digit } ;
    FloatLiteral   = Digit, { Digit }, ".", Digit, { Digit }, [ Exponent ] ;
    NumberLiteral  = IntegerLiteral | FloatLiteral ;
    Expression     = Value ;

Identifiers are ASCII and case-sensitive in version 0.2. Built-ins are lowercase. Whitespace is ignored outside strings and comments. A // comment ends at a line break. Semicolons separate simple statements. In this EBNF, the notation A...Z means any character in that inclusive range.

## Compilation unit

    Program          = TopLevelItem* | MixedProgram ;
    TopLevelItem     = FunctionDefinition | ExecutionBlock ;
    ExecutionBlock   = FlagBlock | ReapBlock ;
    FlagBlock        = "flag" "()" "[" BodyStatement* "]" ;
    ReapBlock        = "reap" "(" Rate? ")" "[" BodyStatement* "]" ;
    Rate             = Expression ;

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
    Return           = "ret" "(" Value? ")" ;
    VariableRead     = "var" "(" Identifier ")" ;
    ParameterRead    = "par" "(" Identifier ")" ;

A semicolon before a closing bracket is optional. A semicolon is mandatory between adjacent simple statements. Newlines alone never separate statements. Function definitions and execution blocks are top-level items, not body statements. Function definitions cannot be nested.

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
    TupleValue       = "tup" "(" ValueList? ")" ;
    ValueList        = Value, { Value } ;
    Comparison       = "com" "(" Value CompareOperator Value ")" ;
    CompareOperator  = "==" | "!=" | ">=" | "<=" | ">" | "<" ;
    BooleanOperation = "and" "(" Value Value ")"
                     | "or" "(" Value Value ")"
                     | "not" "(" Value ")" ;
    Arithmetic       = "cal" "(" NumericExpression ")" ;

val(value) and a bare parenthesized value are transparent wrappers: they preserve the wrapped value and type. Tuples are Core-only in version 0.2.

## Arithmetic precedence

    NumericExpression = Sum ;
    Sum               = Product, { ("+" | "-"), Product } ;
    Product           = Unary, { ("*" | ":"), Unary } ;
    Unary             = ("+" | "-"), Unary | Power ;
    Power             = Atom, [ "^", Unary ] ;
    NumericLiteral    = IntegerLiteral | FloatLiteral ;
    Atom              = NumericLiteral | VariableRead | ParameterRead | FunctionCall
                      | "(" NumericExpression ")" ;

Exponentiation is right-associative. Precedence from highest to lowest is grouping, exponentiation, unary sign, multiplication/division, addition/subtraction. The colon is division.

## Functions

    FunctionDefinition = "func" "(" "(" StringLiteral ")" "(" ParameterList? ")" "(" Type ")" ")" "[" BodyStatement* "]" ;
    Parameter          = "(" Type ")" "(" Identifier ")" ;
    ParameterList      = Parameter, { Parameter } ;
    FunctionCall       = "fun" "(" "(" StringLiteral ")" "(" ArgumentList? ")" ")" ;
    Argument           = "(" Value ")" ;
    ArgumentList       = Argument, { Argument } ;

Example:

    func(("double")((num)(x))((int)))[
      ret(cal(num(par(x))*num(2)));
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

A condition must be boolean in Raw. A mixed file has exactly one outer mixd root; its direct children are non-nested core or rawb regions only. Every top-level item belongs to exactly one region.

## Parser obligations

Implement explicit operator precedence and associativity, not naive string splitting. Reject missing separators, unknown tokens, mismatched delimiters, invalid type forms, nested function definitions, bare top-level statements, and trailing tokens. Preserve source spans for diagnostics. The parser must not invent declarations or conversions.
