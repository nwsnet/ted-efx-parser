import EfxVisitor from "../sdks/1.10/EfxVisitor.js";
import {Duration, DateTime} from "luxon";

class BasicVisitor extends EfxVisitor {
    constructor(fields, codeLists) {
        super();

        if (typeof fields === 'undefined') {
            throw new Error('Invalid field metadata');
        }

        this.fields = fields
        this.codeLists = codeLists
        this.strict = false;
        this.debug = false;
        this.retrieveCodeList = this.#defaultRetrieveCodeList
        this.retrieveValue = this.#defaultRetrieveValue
        this.lazyEvaluation = false;
    }

    #defaultRetrieveCodeList(filename) {
        throw new Error(`Codelist ${filename} not found `);
    }

    #defaultRetrieveValue(fieldDefinition) {
        throw new Error(`Field ${fieldDefinition.id} not found`);
    }

    #getCodeListValues(codelistId, code) {
        const metadata = this.codeLists[codelistId];
        if (this.strict && !metadata) {
            throw new Error(`Codelist ${codelistId} not found`);
        }

        const codelist = this.retrieveCodeList(metadata);

        if (this.strict && !codelist) {
            throw new Error(`Codelist ${codelistId} not found`);
        }

        return codelist?.codes?.map(x => x.codeValue) || [];
    }

    getValueForField(fieldId) {
        if (typeof this.fields[fieldId] === "undefined") {
            return null;
        }
        const fieldDefinition = this.fields[fieldId]
        const value = this.retrieveValue(fieldDefinition);
        if (value === null) {
            return null;
        }

        switch (fieldDefinition?.type || 'code') {
            case 'indicator':
                if (typeof value === 'string') {
                    return value.toLowerCase() === 'true';
                }
                return value;
            case 'number':
            case 'integer':
            case 'amount':
            case 'measure':
                return parseFloat(value);
            case 'date':
            case 'time':
                return DateTime.fromISO(value);
            default:
                console.warn('Unknown field type: ' + fieldDefinition?.type);
                return value;
            case 'id':
            case 'id-ref':
            case 'email':
            case 'url':
            case 'text':
            case 'text-multilingual':
            case 'phone':
            case 'code':
                return value;
        }
    }

    // Binary operations

    visitLogicalOrCondition(ctx) {
        const left = this.getValueFromContext(ctx.booleanExpression(0));
        if (this.lazyEvaluation && true === left) {
            return true;
        }
        const right = this.getValueFromContext(ctx.booleanExpression(1));

        if (this.strict && (typeof left !== 'boolean' || typeof right !== 'boolean')) {
            throw new Error('Invalid operand type: expected boolean');
        }

        return left || right;
    }

    visitLogicalAndCondition(ctx) {
        const left = this.getValueFromContext(ctx.booleanExpression(0));
        if (this.lazyEvaluation && false === left) {
            return false;
        }
        const right = this.getValueFromContext(ctx.booleanExpression(1));

        if (this.strict && (typeof left !== 'boolean' || typeof right !== 'boolean')) {
            throw new Error('Invalid operand type: expected boolean');
        }

        return left && right;
    }

    visitStringInListCondition(ctx) {
        const needle = this.getValueFromContext(ctx.children[0]);
        let haystack = this.getValueFromContext(ctx.children[2]);

        if (typeof haystack === 'string') {
            haystack = [haystack];
        }

        if (null === needle) {
            return false;
        }

        if (this.strict && (!Array.isArray(haystack) || typeof needle !== 'string')) {
            throw new Error('Invalid operand type: expected array and string');
        }

        return haystack.includes(needle);
    }

    #generalComparison(operator, left, right) {
        switch (operator) {
            case '==':
                return left === right;
            case '!=':
                return left !== right;
            case '<':
                return left < right;
            case '>':
                return left > right;
            case '<=':
                return left <= right;
            case '>=':
                return left >= right;
            default:
                throw new Error('Invalid operator');
        }
    }

    visitStringComparison(ctx) {
        const left = this.getValueFromContext(ctx.stringExpression(0));
        const right = this.getValueFromContext(ctx.stringExpression(1));

        if (left === null ^ right === null) {
            return false;
        }

        if (this.strict && (typeof left !== 'string' || typeof right !== 'string')) {
            throw new Error('Invalid operand type: expected string, but got ' + typeof left + ' and ' + typeof right);
        }

        return this.#generalComparison(ctx.operator.text, left, right);
    }

    visitFieldValueComparison(ctx) {
        const left = this.getValueFromContext(ctx.lateBoundExpression(0));
        const right = this.getValueFromContext(ctx.lateBoundExpression(1));

        if (left === null ^ right === null) {
            return false;
        }

        return this.#generalComparison(ctx.operator.text, left, right);
    }

    visitDateComparison(ctx) {
        const left = this.getValueFromContext(ctx.dateExpression(0));
        const right = this.getValueFromContext(ctx.dateExpression(1));

        if (left === null ^ right === null) {
            return false;
        }

        // check if luxon types
        if (this.strict && !(left instanceof DateTime) || !(right instanceof DateTime)) {
            throw new Error('Invalid operand type: expected date, but got ' + typeof left + ' and ' + typeof right);
        }

        return this.#generalComparison(ctx.operator.text, left, right);
    }

    visitDurationComparison(ctx) {
        const left = this.getValueFromContext(ctx.durationExpression(0));
        const right = this.getValueFromContext(ctx.durationExpression(1));
        const operator = ctx.operator.text;

        if (left === null ^ right === null) {
            return false;
        }

        if (this.strict && !(left instanceof Duration) || !(right instanceof Duration)) {
            throw new Error('Invalid operand type: expected duration, but got ' + typeof left + ' and ' + typeof right);
        }

        switch (operator) {
            case '==':
                return +left === +right;
            case '!=':
                return +left !== +right;
            default:
                return this.#generalComparison(operator, left, right);
        }
    }

    visitNumericComparison(ctx) {
        const left = this.getValueFromContext(ctx.numericExpression(0));
        const right = this.getValueFromContext(ctx.numericExpression(1));

        if (left === null ^ right === null) {
            return false;
        }

        if (this.strict && (typeof left !== 'number' || typeof right !== 'number')) {
            throw new Error('Invalid operand type: expected number, but got ' + typeof left + ' and ' + typeof right);
        }

        return this.#generalComparison(ctx.operator.text, left, right);
    }

    visitTimeComparison(ctx) {
        const left = this.getValueFromContext(ctx.timeExpression(0));
        const right = this.getValueFromContext(ctx.timeExpression(1));

        if (left === null ^ right === null) {
            return false;
        }

        if (this.strict && !(left instanceof DateTime) || !(right instanceof DateTime)) {
            throw new Error('Invalid operand type: expected time, but got ' + typeof left + ' and ' + typeof right);
        }

        switch (ctx.operator.text) {
            case '==':
                return +left === +right;
            case '!=':
                return +left !== +right;
            default:
                return this.#generalComparison(ctx.operator.text, left, right);
        }
    }

    visitBooleanComparison(ctx) {
        const left = this.getValueFromContext(ctx.booleanExpression(0));
        const right = this.getValueFromContext(ctx.booleanExpression(1));

        if (left === null ^ right === null) {
            return false;
        }

        if (this.strict && (typeof left !== 'boolean' || typeof right !== 'boolean')) {
            throw new Error('Invalid operand type: expected boolean, but got ' + typeof left + ' and ' + typeof right);
        }

        return this.#generalComparison(ctx.operator.text, left, right);
    }

    visitDateSubtractionExpression(ctx) {
        const left = this.getValueFromContext(ctx.dateExpression(0));
        const right = this.getValueFromContext(ctx.dateExpression(1));

        if (this.strict && !(left instanceof DateTime) || !(right instanceof DateTime)) {
            throw new Error('Invalid operand type: expected date, but got ' + typeof left + ' and ' + typeof right);
        }

        return left.diff(right);
    }

    visitDurationSubtractionExpression(ctx) {
        const left = this.getValueFromContext(ctx.durationExpression(0));
        const right = this.getValueFromContext(ctx.durationExpression(1));

        if (this.strict && !(left instanceof Duration) || !(right instanceof Duration)) {
            throw new Error('Invalid operand type: expected duration, but got ' + typeof left + ' and ' + typeof right);
        }

        return left.minus(right);
    }

    // unary functions

    visitNotFunction(ctx) {
        const value = this.getChildrenValuesFromContext(ctx);
        if (this.strict && typeof value !== 'boolean') {
            throw new Error('Invalid operand type: expected boolean');
        }
        return !value;
    }

    visitCountFunction(ctx) {
        const value = this.getChildrenValuesFromContext(ctx);

        if (this.strict && !Array.isArray(value)) {
            throw new Error('Invalid operand type: expected array, but got ' + typeof value);
        }

        return value.length;
    }

    visitPresenceCondition(ctx) {
        const value = this.getValueFromContext(ctx.children[0]);
        const isPresent = !this.isUndefined(value);

        switch (ctx.modifier?.text?.toLowerCase()) {
            case 'not':
                return !isPresent;
            default:
                return isPresent;
        }
    }

    visitScalarFromFieldReference(ctx) {
        const value = this.getValueForField(ctx.getText());
        if (this.isUndefined(value) && this.debug) {
            console.warn(`Value of Field ${ctx.getText()} not found`);
        }
        return value;
    }

    visitFieldReferenceWithFieldContextOverride(ctx) {
        return this.visitScalarFromFieldReference(ctx);
    }

    // Literal values

    visitStringLiteral(ctx) {
        const rawText = ctx.STRING().getText()
        if (rawText.startsWith("'") || rawText.startsWith('"')) {
            return rawText.slice(1, -1);
        }
        return rawText;
    }

    visitBooleanLiteral(ctx) {
        return ctx.getText().toLowerCase() === 'true';
    }

    visitNumericLiteral(ctx) {
        return parseFloat(ctx.getText());
    }

    visitDateLiteral(ctx) {
        return DateTime.fromISO(ctx.getText());
    }

    visitDurationLiteral(ctx) {
        return Duration.fromISO(ctx.getText(), {});
    }

    visitCodelistId(ctx) {
        return this.#getCodeListValues(ctx.getText());
    }

    // utility functions

    getChildrenValuesFromContext(ctx) {
        return this.filterResults(
            ctx.children.map(
                child => this.getValueFromContext(child)
            )
        );
    }

    getValueFromContext(ctx) {
        let rawValue;

        // all functions are visit + Ctx-classname - "Context"
        let suggestedVisitFunction = 'visit'
        suggestedVisitFunction += ctx.constructor.name.replace('Context', '')

        if (this[suggestedVisitFunction]) {
            rawValue = this[suggestedVisitFunction](ctx)
        } else {
            rawValue = this.visitSingleExpression(ctx)
        }

        return this.filterResults(rawValue)
    }

    // Find values deeply nested in arrays and between undefined values
    filterResults(results) {
        while (Array.isArray(results) && results.length === 1) {
            results = results[0];
        }

        if (Array.isArray(results)) {
            results = this.filterArray(results);
            if (Array.isArray(results)) {
                for (let i = 0; i < results.length; i++) {
                    results[i] = this.filterResults(results[i]);
                }
                results = this.filterArray(results);
            }
        }

        return results;
    }

    isUndefined(value) {
        return typeof value === 'undefined' || value === null;
    }

    filterArray(list) {
        if (Array.isArray(list)) {
            list = list.filter(x => !this.isUndefined(x));
            if (list.length === 1) {
                list = list[0];
            }
        }
        return list;
    }
}

export default BasicVisitor;