const tests = [
    {
        input: "{ND-Root} ${((OPP-070-notice in ('14','19','28','32','35','40') or (OPP-070-notice == 'E5' and BT-01-notice == '32014L0023')) and not(BT-531-Procedure == 'supplies') and not(BT-531-Lot == 'supplies') and not(BT-531-Part == 'supplies')) or not(OPP-070-notice in ('14','19','28','32','35','40') or (OPP-070-notice == 'E5' and BT-01-notice == '32014L0023'))}",
        /**
         * (
         *  (
         *    OPP-070-notice in ('14','19','28','32','35','40') => true
         *    or
         *    (OPP-070-notice == 'E5' and BT-01-notice == '32014L0023') => false
         *  ) => true
         *  and
         *  not(BT-531-Procedure == 'supplies') => true
         *  and not(BT-531-Lot == 'supplies') => not(true) => false
         *  and not(BT-531-Part == 'supplies') => not(true) => false
         * ) => false
         * or
         *  not(
         *   OPP-070-notice in ('14','19','28','32','35','40') => true
         *   or
         *   (OPP-070-notice == 'E5' and BT-01-notice == '32014L0023') => false
         *  ) => false
         *
         *  => false
         */
        vars: {
            "OPP-070-notice": "14",
            "BT-531-Procedure": "supplies",
            "BT-531-Lot": "supplies",
            "BT-531-Part": "supplies",
            "BT-01-notice": "32014L0023"
        },
        expected: false
    },
    {   // same as above, but with different input
        input: "{ND-Root} ${((OPP-070-notice in ('14','19','28','32','35','40') or (OPP-070-notice == 'E5' and BT-01-notice == '32014L0023')) and not(BT-531-Procedure == 'supplies') and not(BT-531-Lot == 'supplies') and not(BT-531-Part == 'supplies')) or not(OPP-070-notice in ('14','19','28','32','35','40') or (OPP-070-notice == 'E5' and BT-01-notice == '32014L0023'))}",
        /**
         * (
         *  (
         *    OPP-070-notice in ('14','19','28','32','35','40') => true
         *    or
         *    (OPP-070-notice == 'E5' and BT-01-notice == '32014L0023') => false
         *  ) => true
         *  and not(BT-531-Procedure == 'supplies') => not(false) => true
         *  and not(BT-531-Lot == 'supplies') => not(false) => true
         *  and not(BT-531-Part == 'supplies') => not(false) => true
         * ) => true
         * or
         *  not(
         *   OPP-070-notice in ('14','19','28','32','35','40') => true
         *   or
         *   (OPP-070-notice == 'E5' and BT-01-notice == '32014L0023') => false
         *  ) => false
         *
         *  => false
         */
        vars: {
            "OPP-070-notice": "14",
            "BT-531-Procedure": "other",
            "BT-531-Lot": "other",
            "BT-531-Part": "other",
            "BT-01-notice": "32014L0023"
        },
        expected: true
    },
    {
        input: "{ND-LocalLegalBasisNoID} ${BT-01(e)-Procedure is not present}",
        vars: {},
        expected: true
    },
    {
        input: "{ND-LocalLegalBasisNoID} ${BT-01(e)-Procedure is not present}",
        vars: {
            "BT-01(e)-Procedure": "other"
        },
        expected: false
    },
    {
        input: "{ND-Root} ${((BT-03-notice == 'cont-modif') and (BT-02-notice in (cont-modif))) or not(BT-03-notice == 'cont-modif')}",
        vars: {
            "BT-03-notice": "cont-modif",
            "BT-02-notice": "can-modif"
        },
        codelists: ['notice-type_cont-modif.gc'],
        expected: true
    },
    {
        input: "{ND-Root} ${((BT-03-notice == 'cont-modif') and (BT-02-notice in (cont-modif))) or not(BT-03-notice == 'cont-modif')}",
        vars: {
            "BT-03-notice": "cont-modif",
            "BT-02-notice": "other"
        },
        codelists: ['notice-type_cont-modif.gc'],
        expected: false
    }
];

export { tests };