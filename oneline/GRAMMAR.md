# OneLine Formal Grammar

The canonical syntax and semantics are defined in SPECIFICATION.md. This file summarizes the parser structure.

## Lexical tokens

    Identifier      = Letter, { Letter | Digit | "_" } ;
    StringLiteral   = '"', { Character | Escape }, '"' ;
    Escape          = "\\" | "\\"" | "\\n" | "\\r" | "\\t" ;
    Boolean         = "TRUE" | "FALSE" ;
    Type            = "int" | "flo" | "num" | "txt" | "boo" | "nul" ;

Identifiers are ASCII and case-sensitive in version 0.2. Built-ins are lowercase. Whitespace is ignored outside strings and comments. // comments end at a line break. Semicolons separate simple statements.

## Program structure

    Program       = Statement* ;
    Statement     = Declaration ";"
                  | Assignment ";"
                  | Output ";"
                  | Return ";"
                  | Expression ";"
                  | Conditional
                  | Block ;
    Block         = "flag" "(" ")" "[" Statement* "]"
                  | "reap" "(" Rate? ")" "[" Statement* "]"
                  | FunctionDefinition ;
    Rate          = Expression ;

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
                  | "nul" "(" ")"
                  | "txt" "(" StringLiteral ")"
                  | "int" "(" IntegerLiteral ")"
                  | "flo" "(" FloatLiteral ")"
                  | "num" "(" NumberLiteral ")" ;
    Value         = Literal | VariableRead | ParameterRead | FunctionCall
                  | Arithmetic | Comparison | BooleanOperation | TupleValue ;
    TupleValue    = "tup" "(" ValueList? ")" ;
    ValueList     = Value, { Value } ;
    Comparison    = "com" "(" Value CompareOperator Value ")" ;
    CompareOperator = "==" | "!=" | ">=" | "<=" | ">" | "<" ;
    BooleanOperation = "and" "(" Value Value ")"
                     | "or" "(" Value Value ")"
                     | "not" "(" Value ")" ;
    Arithmetic    = "cal" "(" NumericExpression ")" ;

    NumericExpression = NumericExpression "+" NumericExpression
                      | NumericExpression "-" NumericExpression
                      | NumericExpression "*" NumericExpression
                      | NumericExpression ":" NumericExpression
                      | NumericExpression "^" NumericExpression
                      | NumericAtom ;
    NumericAtom   = NumericLiteral | VariableRead | ParameterRead | FunctionCall
                  | "(" NumericExpression ")" ;

Raw permits only the value forms and types listed in SPECIFICATION.md. Tuples are Core-only in version 0.2.

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
                    ("else" "[" Statement* "]")? ;
    MixedProgram  = "mixd" "(" ")" "[" Region+ "]" ;
    Region        = "core" "(" ")" "[" Statement* "]"
                  | "rawb" "(" ")" "[" Statement* "]" ;

A mixed file has exactly one outer mixd root; its direct children are non-nested core or rawb regions only.

## Parser obligations

Implement explicit operator precedence and associativity, not naive string splitting. Raw uses exponentiation right-associative, then unary sign, multiplication/division, and addition/subtraction. Reject missing separators, unknown tokens, mismatched delimiters, and trailing tokens.
