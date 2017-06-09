var ccbooleananalysis = require("../src/ccBooleanAnalysis.js");


let lacOperon = ["lac_mRNA = lac_operon",
                  "lac_repressor = ~(allolactose)",
                  "lac_enzymes = lac_mRNA",
                  "CAP = cAMP",
                  "lactose_breakdown = lac_enzymes * ~(lacZ_mutation)",
                   "allolactose = enviro_lactose",
                    "cAMP = ~(enviro_glucose)",
                    "lac_operon = CAP * ~((CAP_mutation + lac_repressor))"];


let guardCellAbcisic = [
  "NO = (NOS * NIA12)", "NOS = Ca2_c", "NIA12 = RCN1", "PLC = (ABA * Ca2_c)",
  "Ca2_c = (CIS * ~(Ca2_ATPase) + CaIM * ~(Ca2_ATPase))","CaIM = ((ABH1 * ~ERA1) * ~(Depolar) + (ERA1 * ~ABH1) * ~(Depolar) + ROS * ~(Depolar)) + ~(Depolar + ERA1 + ABH1 + ROS)",
  "Depolar = (AnionEM + (Ca2_c * (~KOUT + ~HTPase)) + (HTPase * (~Ca2_c + ~KOUT)) + KEV + (KOUT * (~Ca2_c + ~HTPase))) + ~(AnionEM + KOUT + HTPase + Ca2_c + KEV)",
  "ROS = Atrboh", "GPA1 = (AGB1 * ~(GCR1) + (S1P * AGB1))",
  "AGB1 = GPA1", "S1P = SphK", "Atrboh = (OST1 * (ROP2 * pH)) * ~(ABI1)",
  "ABI1 = pH * ~((PA + ROS))", "OST1 = ABA", "ROP2 = PA",
  "pH = ABA * ~(pH)", "HTPase = ~((Ca2_c + ROS + pH))",
  "Malate = PEPC * ~((ABA + AnionEM))", "AnionEM = ((Ca2_c * (~ABI1 + pH)) + (pH * (~ABI1 + Ca2_c)))",
  "PEPC = ~(ABA)", "RAC1 = ~((ABA + ABI1))",
  "Actin = Ca2_c * ~(RAC1)", "PA = PLD",
  "KAP = Depolar * ~((Ca2_c * pH))", "Ca2_ATPase = Ca2_c",
  "CIS = ((InsP3 * InsP6) + (cGMP * cADPR))", "InsP3 = PLC",
  "InsP6 = InsPK", "cGMP = GC",
  "cADPR = ADPRc", "KOUT = (Depolar * ~((ROS * NO)) + (pH * Depolar))",
  "KEV = Ca2_c", "Closure = ((KAP * (Actin * AnionEM)) * ~(Malate) + (KOUT * (Actin * AnionEM)) * ~(Malate))",
  "ADPRc = NO", "GC = NO", "InsPK = ABA", "RCN1 = ABA",
  "PLD = GPA1", "SphK = ABA", "ROP10 = ERA1"
];

let mammalianCellCycle = [
  "UbcH10 = (Cdc20 * ~(Cdh1) + CycA * ~(Cdh1) + CycB * ~(Cdh1) + (UbcH10 * (~Cdh1 + (Cdh1 * (CycA + Cdc20 + CycB))))) + ~(Cdh1 + Cdc20 + CycA + CycB + UbcH10)",
  "p27 = p27 * ~((CycD + (CycA * CycE) + CycB)) + ~(CycE + CycA + CycB + CycD + p27)",
  "CycE = E2F * ~(Rb)",
  "Rb = p27 * ~((CycD + CycB)) + ~(CycA + CycB + CycD + CycE + p27)",
  "Cdh1 = (Cdc20 + p27 * ~(CycB)) + ~(CycA + CycB + Cdc20 + p27)",
  "Cdc20 = CycB",
  "CycB = ~((Cdc20 + Cdh1))",
  "CycA = (CycA * ~((Cdc20 + (Cdh1 * UbcH10) + Rb)) + E2F * ~((Cdc20 + (Cdh1 * UbcH10) + Rb)))",
  "CycD = CycD + ~(CycD)",
  "E2F = p27 * ~((CycB + Rb)) + ~(CycB + Rb + CycA + p27)"
];


// console.log(ccbooleananalysis._getGraph(lacOperon).data);
console.log(ccbooleananalysis.connectivityOutDegree(guardCellAbcisic));
console.log(ccbooleananalysis.connectivityInDegree(lacOperon));
console.log(ccbooleananalysis.connectivityDegree(mammalianCellCycle));
