var ccbooleananalysis = require("../src/ccBooleanAnalysis.js");


let lacOperon = ["lac_mRNA = lac_operon",
                  "lac_repressor = ~(allolactose)",
                  "lac_enzymes = lac_mRNA",
                  "CAP = cAMP",
                  "lactose_breakdown = lac_enzymes * ~(lacZ_mutation)",
                   "allolactose = enviro_lactose",
                    "cAMP = ~(enviro_glucose)",
                    "lac_operon = CAP * ~((CAP_mutation + lac_repressor))"];


// console.log(ccbooleananalysis._getGraph(lacOperon).data);
console.log(ccbooleananalysis.connectivityOutDegree(lacOperon));
console.log(ccbooleananalysis.connectivityInDegree(lacOperon));
console.log(ccbooleananalysis.connectivityDegree(lacOperon));
