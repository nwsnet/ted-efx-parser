/**
 * This file is used to run the tests defined in the data folder.
 *
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * THIS FILE DEPENDS ON THE TED EFORMS EDITOR DEMO: https://github.com/OP-TED/eforms-notice-editor
 * Define the TED_EFORMS_EDITOR_BASEURL constant to point to the demo's URL.
 * AND SET THE SDK_VERSION to the version of the editor you are using.
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */
import {tests} from "./data/basic.js";

import createEfxParser from "../efx-parser.js";
import {fetchCodeList, fetchFieldMetadata, getCodeList, mapListToIdKeys} from "./util/eforms-notice-editor.js";

const SDK_VERSION = '1.10';
const TED_EFORMS_EDITOR_BASEURL = 'http://localhost:8081';

const basicMetadata = await fetchFieldMetadata(TED_EFORMS_EDITOR_BASEURL, SDK_VERSION);
const fields = mapListToIdKeys(basicMetadata.fieldsJson.fields);
const codelists = mapListToIdKeys(basicMetadata.codelistsJson.codelists);

let currentTestVars = {};

const efxEvaluate = createEfxParser(fields, codelists, visitor => {

  visitor.debug = true;

  visitor.retrieveValue = (fieldDefinition) => currentTestVars[fieldDefinition.id] || null;

  visitor.retrieveCodeList = (listDefinition) => {
    if (typeof getCodeList(listDefinition.filename) === 'undefined') {
      throw new Error(`Codelist ${listDefinition.filename} not found`);
    }
    return getCodeList(listDefinition.filename);
  }
})

const runTests = async tests => {
  let testID = 0;
  let timeSum = 0;

  for (const test of tests) {
    ++testID

    for (const codelist of test?.codelists || []) {
      await fetchCodeList(TED_EFORMS_EDITOR_BASEURL, SDK_VERSION, codelist);
    }

    currentTestVars = test.vars;
    const start = performance.now();
    let result = efxEvaluate(test.input);
    const end = performance.now();
    timeSum += end - start;
    currentTestVars = {};

    console.log(`Test ${testID}: ${result === test.expected ? 'PASS' : 'FAIL'}`);
    if (result !== test.expected) {
      console.log(`  Expected: ${test.expected}`);
      console.log(`  Got: ${result} (${typeof result})`);
      console.log(test);
    }
  }
  console.log(`Total time: ${timeSum}ms`);
}

await runTests(tests);
