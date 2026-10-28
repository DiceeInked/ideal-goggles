# OneLine Translation Model

**Status:** Design draft, version 0.1  
**Purpose:** Define how the translator should move between source languages, OneLine Core, OneLine Raw, and target languages.

## 1. Translation pipeline

The proposed pipeline is:

1. **Read source:** parse the source language with a source-specific parser or a reliable compiler frontend.
2. **Build semantic model:** capture types, operations, evaluation order, scopes, control flow, errors, and required runtime services.
3. **Represent in Core:** express the program's meaning in OneLine Core plus structured semantic annotations where needed.
4. **Check requested Raw constraints:** determine whether the program can be represented by OneLine Raw without losing meaning.
5. **Check target compatibility:** compare the semantic model with the target language and platform.
6. **Transform or report:** generate equivalent code, generate helper code where allowed, or explain what cannot be preserved.
7. **Validate output:** use target parsers, type checkers, tests, or compiler diagnostics when available.

The internal representation should not be a string of OneLine source code alone. It should be a structured representation such as an abstract syntax tree (AST) plus explicit type and semantic metadata.

## 2. Core and Raw have different jobs

Core can express differences between languages. Raw defines the restricted rules that direct users can rely on.

For example, suppose a source language defines division by zero to return zero, while a target language raises an error. Core should preserve the source behavior in its semantic model. The translator can then:
- generate a guard or helper that returns zero, if this reproduces the source semantics;
- report that adaptation requires a supported runtime helper;
- or mark the translation blocked if the target cannot reproduce the behavior.

Raw, by contrast, defines division by zero as a runtime error. A Raw program must not silently inherit a different rule from whichever target receives it.

## 3. Compatibility outcomes

Every target translation should produce one of these outcomes:

- **Direct:** the target operation preserves the required behavior without extra adaptation.
- **Adapted:** helper code or a supported runtime adapter preserves the behavior.
- **Blocked:** the target cannot reproduce the required behavior under current translator support.
- **Unverified:** the translator cannot prove equivalence with available analysis and tests.

Do not report a blocked or unverified translation as fully successful. Explain the relevant expression or feature, expected behavior, target behavior, and available options.

## 4. Avoiding unnecessary roadblocks

If source and target languages already behave equivalently for a particular operation, translation should proceed normally. The program should not be rejected just because it passes through Core.

Compatibility is determined by the specific semantics and target, not by requiring every program to adopt every limitation of every language.

For example, two languages may both define a particular division operation to produce infinity for a nonzero numerator divided by zero. If their types, precision, and surrounding behavior are also compatible, the translator need not reject that operation merely because another language treats division by zero as an error.

## 5. What must be compared

The compatibility checker should consider, where relevant:
- Type and conversion rules.
- Integer width, overflow, and signedness.
- Floating-point precision, rounding, NaN, and infinity.
- Division by zero and other exceptional cases.
- Null and missing-value behavior.
- Evaluation order and short-circuit behavior.
- String encoding and indexing.
- Collection and aggregate behavior.
- Function calling conventions and return values.
- Exception and error handling.
- Concurrency and scheduling.
- Memory/resource limits.
- File, network, console, clock, random, graphics, and platform APIs.

The first implementation should support a small, explicitly listed subset rather than claim to solve every item at once.

## 6. Diagnostics in the editor

A useful diagnostic should say:
- where the problem occurs;
- what the source program means;
- what the target does differently;
- whether an automatic transformation is available;
- whether the user must change the code or select a different target.

Example:

> **Compatibility warning:** This source operation returns zero when the divisor is zero. The selected target raises a runtime error. A guard can preserve the source behavior; generated helper code is available. Choose “adapt” to continue, or edit the operation manually.

This is an illustrative message, not a promise that every language pair can be adapted automatically.

## 7. Why matching features are not enough

Two languages can both have an operation named “division” while differing in numeric types, overflow, evaluation order, or edge cases. Conversely, languages with different syntax may have equivalent behavior.

The translator must compare semantics, not just token names or whether a feature exists.

## 8. Recommended implementation stages

1. Define the OneLine grammar and type rules.
2. Build a parser and validator for OneLine Raw.
3. Define a structured Core representation.
4. Implement a few source and target adapters for a deliberately small subset.
5. Add compatibility diagnostics.
6. Add transformations with tests that compare observable behavior.
7. Expand supported language pairs only when their semantics are documented and tested.
