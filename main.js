/**
 * EFX expression ANTLR4 parser.
 * Inputs a expression string and environment variables and returns the result.
 */

import {InputStream, CommonTokenStream} from 'antlr4';
import {tests} from "./tests/basic.js";

import EfxLexer from './sdk/1.10/EfxLexer.js';
import EfxParser from './sdk/1.10/EfxParser.js';
import EformsVisitor from './EformsVisitor.js';

const codeLists = {}
const cache = {}
const getJson = async (url) => {
    if (!!cache[url]) {
        return cache[url]
    }
    cache[url] = await (await fetch(url)).json()
    return cache[url]
};
const fetchCodeList = async (filename) => codeLists[filename] = await getJson(`http://localhost:8081/sdk/1.9/codelists/${filename}/lang/en`);

const fieldMetadata = await getJson('http://localhost:8081/sdk/1.10/basic-meta-data');

const evaluate = (input, vars, debug) => {
    const inputStream = new InputStream(input);
    const lexer = new EfxLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new EfxParser(tokenStream);
    const tree = parser.singleExpression();
    const visitor = new EformsVisitor(JSON.parse(JSON.stringify(fieldMetadata)));
    visitor.debug = debug
    visitor.strict = true
    visitor.setVars(vars)

    visitor.retrieveCodeList = (filename) => {
        if (typeof codeLists[filename] === 'undefined') {
            throw new Error(`Codelist ${filename} not found`);
        }
        return codeLists[filename];
    }

    return visitor.getValueFromContext(tree);
}

const runTests = async tests => {
    let testID = 0;
    for (const test of tests) {
        ++testID

        for (const codelist of test?.codelists || []) {
            await fetchCodeList(codelist);
        }

        const result = evaluate(test.input, test.vars, testID === 5);
        console.log(`Test ${testID}: ${result === test.expected ? 'PASS' : 'FAIL'}`);
        if (result !== test.expected) {
            console.log(`  Expected: ${test.expected}`);
            console.log(`  Got: ${result} (${typeof result})`);
            console.log(test);
        }
    }
}

await runTests(tests);
