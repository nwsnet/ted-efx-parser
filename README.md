# TED eForms Expression Language Visitor
This project contains a visitor for the eForms Expression Language (EFX) from TED. It can be used for parsing and processing the eForms Expression Language.  
Details about EFX are described here: [EFX Documentation](https://docs.ted.europa.eu/eforms/latest/efx/index.html)

## Implementation
The `createEfxParser` function from [efx-parser.js](efx-parser.js) serves to create a function that is capable of evaluating an eForms Expression.
Initially, it needs to be supplied with the fields and codelists from the SDK. Afterwards, it returns a function that can then evaluate the expression.

The third option is a configuration function, intended for configuring the visitor  
The `retrieveValue` and `retrieveCodeList` methods should always be defined to inform the visitor about the procedure to retrieve the values and codelists from your implementation of the form.

Refer to the [tests/run-tests.js](tests/run-tests.js) file for an example.

## Problems
- All code lists and their contents must have been loaded beforehand, as the visitor currently provides no support for asynchronous requests to load them on demand.

## Building an ANTLR4 parser
TED utilizes ANTLR4 for generating the parser for the eForms Expression Language.  
This project already includes the generated parser files for the SDK versions 1.9 and 1.10.

The ANTLR4 tool can be downloaded from: https://www.antlr.org/download.html

The grammar for the EFX Language has been defined in `.g4` files for each SDK version.  
The latest versions of the Grammar files are available here: https://github.com/OP-TED/eForms-SDK/tree/develop/efx-grammar

Generate the parser files by executing the following command in the `efx-grammar` directory of the SDK:
```shell
shell antlr4 -Dlanguage=JavaScript -visitor Efx.g4 EfxLexer.g4
```

This generates the parser files in the same directory which the visitor uses. Refer to [BasicVisitor.js](src/BasicVisitor.js) for the generated files.