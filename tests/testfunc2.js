var ccbooleananalysis = require("../src/ccBooleanAnalysis.js");


var eq1 = "0";
var eq2 = "( ( ( S_4  *  ( ( ( S_75   *  S_2 ) ) )     )  *  ~  ( S_115  )  )  *  ~  ( S_2  ) )";

console.log(JSON.stringify(ccbooleananalysis.compareBooleansSAT(eq1, eq2)));

