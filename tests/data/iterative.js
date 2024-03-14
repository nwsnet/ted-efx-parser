const tests= [
    {
        input: "{ND-GroupComposition} ${every text:$lot in BT-1375-Procedure satisfies ($lot in /BT-137-Lot)}",
        /**
         * for each $lot in BT-1375-Procedure
         *  /BT-137-Lot includes $lot
         */
        vars: {
            "BT-1375-Procedure": {
                "1": "LOT-001",
                "2": "LOT-005",
                "3": "LOT-003",
            },
            "BT-137-Lot": {
                "1": "LOT-001",
                "2": "LOT-002",
                "3": "LOT-003",
                "4": "LOT-004",
                "5": "LOT-005",
            }
        },
        expected: true
    }
]

export { tests };