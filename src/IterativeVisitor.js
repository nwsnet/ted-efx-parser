import BasicVisitor from "./BasicVisitor.js";

class IterativeVisitor extends BasicVisitor {
    constructor(fieldMetadata) {
        super(fieldMetadata);
        this.variables = {};
    }

    #declareVariable(variableName, reference = undefined, value = undefined) {
        let previous = this.variables[variableName] || {};

        this.variables[variableName] = {
            ...previous,
            ...(reference !== undefined ? {reference} : {}),
            ...(value !== undefined ? {value} : {})
        };
    }

    /**
     * Expression like: every text:$lot in BT-1375-Procedure satisfies ($lot in /BT-137-Lot)
     */
    visitQuantifiedExpression(ctx) {
        const values = this.getValueFromContext(ctx.children[1]); // introduce variable
        for (const item of collection) {
            this.variables[variableName].current = item;
            const collection = this.getValueFromContext(ctx.children[3]);
            const result = this.getValueFromContext(ctx.children[5]);
            if (!result) {
                return false;
            }
        }
        return super.visitQuantifiedExpression(ctx);
    }

    visitVariableReference(ctx) {
        const variableMeta = this.variables[ctx.getText()];
        if (variableMeta === undefined) {
            throw new Error(`Variable ${ctx.getText()} not found`);
        }
        if (typeof variableMeta.current !== 'undefined') {
            return variableMeta.current;
        }
        return variableMeta.value;
    }

    visitStringIteratorExpression(ctx) {
        const variableName = ctx.children[0].getText().split(':')[1];
        const variableValue = this.getValueFromContext(ctx.children[2]);
        this.#declareVariable(variableName, undefined, variableValue)
    }

    visitStringVariableDeclaration(ctx) {
        let variableReference = ctx.children[0].getText();
        if (variableReference.endsWith(':')) {
            variableReference = variableReference.slice(0, -1);
        }
        const variableName = ctx.children[1].getText();
        this.#declareVariable(variableName, variableReference)
    }

    visitIteratorExpression(ctx) {
        return super.visitIteratorExpression(ctx);
    }
}

export default IterativeVisitor;