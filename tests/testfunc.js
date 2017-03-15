var ccbooleananalysis = require("../build/ccBooleanAnalysis.js");


// console.log(ccbooleananalysis.getParseTree("ROR AND AB"));
// console.log(ccbooleananalysis.getParseTree("AND"));
// console.log(ccbooleananalysis.getParseTree("NOT"));
// console.log(ccbooleananalysis.getParseTree("RAND OR NAND or LCKP1"));
// console.log(ccbooleananalysis.getParseTree("OR"));
// console.log(ccbooleananalysis.getParseTree("NOT AB"));
// console.log(ccbooleananalysis.getParseTree("NO OR ROR"));



console.log('ROR + Y');
console.log(ccbooleananalysis.getBiologicalConstructs('ROR + Y'));

console.log("\n");

console.log('NOT');
console.log(ccbooleananalysis.getBiologicalConstructs('NOT'));
