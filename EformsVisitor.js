import EfxVisitor from "./sdk/1.10/EfxVisitor.js";
import {Duration, DateTime} from "luxon";

class EformsVisitor extends EfxVisitor {
    constructor(fieldMetadata) {
        super();
        const fields = fieldMetadata?.fieldsJson?.fields
        const codeLists = fieldMetadata?.codelistsJson?.codelists

        if (typeof fields === 'undefined') {
            throw new Error('Invalid field metadata');
        }

        this.fields = {}
        this.codeLists = {}
        this.strict = false;
        this.debug = false;
        this.vars = {}
        this.retrieveCodeList = this.#retrieveCodeList

        for (const field of fields) {
            this.fields[field.id] = field;
        }

        for (const codelist of codeLists) {
            this.codeLists[codelist.id] = codelist;
        }
    }

    #retrieveCodeList(filename) {
        throw new Error(`Codelist ${filename} not found `);
    }

    #getCodeListValues(codelistId, code) {
        const metadata = this.codeLists[codelistId];
        if (this.strict && !metadata) {
            throw new Error(`Codelist ${codelistId} not found`);
        }

        const filename = metadata?.filename;

        const codelist = this.retrieveCodeList(filename);

        if (this.strict && !codelist) {
            throw new Error(`Codelist ${codelistId} not found`);
        }

        return codelist?.codes?.map(x => x.codeValue) || [];
    }

    setVars(vars, deleteOld) {
        if (deleteOld) {
            for (const fieldId in this.vars) {
                if (!vars[fieldId]) {
                    delete this.vars[fieldId];
                }
            }
            this.vars = {}
        }
        for (const fieldId in vars) {
            if (this.fields[fieldId]) {
                this.fields[fieldId].value = vars[fieldId];
            } else {
                console.warn('Field not found for var:' + fieldId);
            }
        }
        this.vars = { ...this.vars, ...vars };
    }

    getValueForField(fieldId) {
        if (typeof this.fields[fieldId] === "undefined") {
            return null;
        }
        const fieldDefinition = this.fields[fieldId]
        const value = fieldDefinition?.value || null;
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
        const right = this.getValueFromContext(ctx.booleanExpression(1));

        if (this.strict && (typeof left !== 'boolean' || typeof right !== 'boolean')) {
            throw new Error('Invalid operand type: expected boolean');
        }

        return left || right;
    }

    visitLogicalAndCondition(ctx) {
        const left = this.getValueFromContext(ctx.booleanExpression(0));
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

        if (this.strict && (!Array.isArray(haystack) || typeof needle !== 'string')) {
            throw new Error('Invalid operand type: expected array and string');
        }

        return haystack.includes(needle);
    }

    visitStringComparison(ctx) {
        const left = this.getValueFromContext(ctx.stringExpression(0));
        const right = this.getValueFromContext(ctx.stringExpression(1));

        if (this.strict && (typeof left !== 'string' || typeof right !== 'string')) {
            throw new Error('Invalid operand type: expected string');
        }

        return left === right;
    }

    visitFieldValueComparison(ctx) {
        const left = this.getValueFromContext(ctx.lateBoundExpression(0));
        const right = this.getValueFromContext(ctx.lateBoundExpression(1));

        switch (ctx.operator.text) {
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

    visitDateComparison(ctx) {
        const left = this.getValueFromContext(ctx.dateExpression(0));
        const right = this.getValueFromContext(ctx.dateExpression(1));
        const operator = ctx.operator.text;

        // check if luxon types
        if (this.strict && !(left instanceof DateTime) || !(right instanceof DateTime)) {
            throw new Error('Invalid operand type: expected date');
        }

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

    visitDurationComparison(ctx) {
        const left = this.getValueFromContext(ctx.durationExpression(0));
        const right = this.getValueFromContext(ctx.durationExpression(1));
        const operator = ctx.operator.text;

        if (this.strict && !(left instanceof Duration) || !(right instanceof Duration)) {
            throw new Error('Invalid operand type: expected duration');
        }

        switch (operator) {
            case '==':
                return left.equals(right);
            case '!=':
                return !left.equals(right);
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

    visitDateSubtractionExpression(ctx) {
        const left = this.getValueFromContext(ctx.dateExpression(0));
        const right = this.getValueFromContext(ctx.dateExpression(1));

        if (this.strict && !(left instanceof DateTime) || !(right instanceof DateTime)) {
            throw new Error('Invalid operand type: expected date');
        }

        return left.diff(right);
    }

    // unary functions

    visitNotFunction(ctx) {
        const value = this.getChildrenValuesFromContext(ctx);
        if (this.strict && typeof value !== 'boolean') {
            throw new Error('Invalid operand type: expected boolean');
        }
        return !value;
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

    visitPresenceCondition(ctx) {

        const value = this.getValueFromContext(ctx.children[0]);
        const isPresent = !this.isUndefined(value);

        switch (ctx.modifier.text.toLowerCase()) {
            case 'not':
                return !isPresent;
            default:
                return isPresent;
        }
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

export default EformsVisitor;