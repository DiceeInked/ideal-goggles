# OneLine Formal Grammar

The canonical syntax and semantics are defined in [SPECIFICATION.md](SPECIFICATION.md). This file summarizes the parser structure.

## Lexical tokens

    Identifier      = Letter, { Letter | Digit | "_" } ;
    StringLiteral   = '"', { Character | Escape }, '"' ;
    Escape          = backslash | escaped-quote | newline | carriage-return | tab ;
    Boolean         = "TRUE" | "FALSE" ;
    Type            = "int" | "flo" | "num" | "txt" | "boo" | "nul" ;

Identifiers are ASCII and case-sensitive in version 0.2. Built-ins are lowercase. Whitespace is ignored outside strings and comments. A // comment ends at a line break. Semicolons separate simple statements.

## Program structure

    Program       = Statement* ;
    Statement     = Declaration ";"
                  | Assignment ";"
                  | Output ";"
                  | Return ";"
                  | Expression ";"
                  | Conditional
                  | Block ;
    Block         = "flag" "()" "[" Statement* "]"
                  | "reap" "(" Rate? ")" "[" Statement* "]"
                  | FunctionDefinition ;
    Declaration   = "glo" "(" "(" Type ")" "(" Identifier ")" Value ")"
                  | "loc" "(" "(" Type ")" "(" Identifier ")" Value ")" ;
    Assignment    = "set" "(" "(" Identifier ")" Value ")" ;
    Output        = "say" "(" Value ")" ;
    Return        = "ret" "(" Value? ")" ;
    VariableRead  = "var" "(" Identifier ")" ;
    ParameterRead = "par" "(" Identifier ")" ;

A semicolon before a closing bracket is optional. A semicolon is mandatory between adjacent simple statements. Newlines alone never separate statements.

## Values and operations

    Literal       = "boo" "(" Boolean ")"
                  | "nul" "()"
                  | "txt" "(" StringLiteral ")"
                  | "int" "(" IntegerLiteral ")"
                  | "flo" "(" FloatLiteral ")"
                  | "num" "(" NumberLiteral ")" ;
    Value         = Literal | "val" "(" Value ")" | VariableRead | ParameterRead
                  | FunctionCall | Arithmetic | Comparison | BooleanOperation
                  | TupleValue | "(" Value ")" ;
    TupleValue    = "tup" "(" ValueList? ")" ;
    ValueList     = Value, { Value } ;
    Comparison    = "com" "(" Value CompareOperator Value ")" ;
    CompareOperator = "==" | "!=" | ">=" | "<=" | ">" | "<" ;
    BooleanOperation = "and" "(" Value Value ")"
                     | "or" "(" Value Value ")"
                     | "not" "(" Value ")" ;
    Arithmetic    = "cal" "(" NumericExpression ")" ;

val(value) and a bare parenthesized value are transparent wrappers: they preserve the wrapped value and type. Tuples are Core-only in version 0.2.

## Arithmetic precedence

    NumericExpression = Sum ;
    Sum           = Product, { ("+" | "-"), Product } ;
    Product       = Unary, { ("*" | ":"), Unary } ;
    Unary         = ("+" | "-"), Unary | Power ;
    Power         = Atom, [ "^", Unary ] ;
    Atom          = NumericLiteral | VariableRead | ParameterRead | FunctionCall
                  | "(" NumericExpression ")" ;

Exponentiation is right-associative. Precedence from highest to lowest is grouping, exponentiation, unary sign, multiplication/division, addition/subtraction.

## Functions

    FunctionDefinition = "func" "(" "(" StringLiteral ")" "(" ParameterList? ")" "(" Type ")" ")" "[" Statement* "]" ;
    Parameter           = "(" Type ")" "(" Identifier ")" ;
    ParameterList       = Parameter, { Parameter } ;
    FunctionCall        = "fun" "(" "(" StringLiteral ")" "(" ArgumentList? ")" ")" ;
    Argument            = "(" Value ")" ;
    ArgumentList        = Argument, { Argument } ;

Example:

    func(("double")((num)(x))((int)))[
      ret(cal(num(par(x))*num(2)));
    ]
    say(fun(("double")((int(5)))));

Function names are quoted. Variable and parameter names are bare identifiers. Function definitions must precede calls.

## Conditions and mixed mode

    Conditional   = "cond" "(" Value ")" "[" Statement* "]"
                    [ "else" "[" Statement* "]" ] ;
    MixedProgram  = "mixd" "()" "[" Region+ "]" ;
    Region        = "core" "()" "[" Statement* "]"
                  | "rawb" "()" "[" Statement* "]" ;

A condition must be boolean in Raw. A mixed file has exactly one outer mixd root; its direct children are non-nested core or rawb regions only.

## Parser obligations

Implement explicit operator precedence and associativity, not naive string splitting. Reject missing separators, unknown tokens, mismatched delimiters, invalid type forms, and trailing tokens. Preserve source spans for diagnostics. The parser must not invent declarations or conversions.