import {CommonTokenStream, InputStream} from "antlr4";
import EfxLexer from "./sdks/1.10/EfxLexer.js";
import EfxParser from "./sdks/1.10/EfxParser.js";
import BasicVisitor from "./src/BasicVisitor.js";

/**
 * A function that creates an EfxParser function.
 *
 * @param {Object} fields - The field metadata object. A flat map of field IDs to field definitions.
 * @param {Object} codeLists - The code lists object. A flat map of code list id to code list metadata.
 * @param {Function} configureVisitor - An optional function to configure the visitor object.
 * @returns {Function} - A function that takes an input string and returns the value of the expression.
 */
const createEfxParser = (fields, codeLists, configureVisitor) => (input) => {
  const inputStream = new InputStream(input);
  const lexer = new EfxLexer(inputStream);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new EfxParser(tokenStream);
  const tree = parser.singleExpression();
  const visitor = new BasicVisitor(fields, codeLists);

  // Some default configuration
  visitor.debug = false;
  visitor.strict = true;
  visitor.lazyEvaluation = false;

  if (typeof configureVisitor === 'function') {
    configureVisitor(visitor);
  }

  return visitor.getValueFromContext(tree);
}

export default createEfxParser;