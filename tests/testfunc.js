var ccbooleananalysis = require("../src/ccBooleanAnalysis.js");


var lacOperon = ["lac_mRNA = lac_operon",
                  "lac_repressor = ~(allolactose)",
                  "lac_enzymes = lac_mRNA",
                  "CAP = cAMP",
                  "lactose_breakdown = lac_enzymes * ~(lacZ_mutation)",
                   "allolactose = enviro_lactose",
                    "cAMP = ~(enviro_glucose)",
                    "lac_operon = CAP * ~((CAP_mutation + lac_repressor))"];


var guardCellAbcisic = [
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

var mammalianCellCycle = [
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

var cd4tcellsignalling = [
    "ITAMS = Lck",
    "adenyl_cyclase = GalphaS_R",
    "IL9R = (IL9_e + JAK3)",
    "DAG = (PLCb + PLCg)",
    "IL17 = (NFAT * (proliferation * STAT3 * RORGT * NFKB)) * ~(((STAT1 * FOXP3) + (STAT5 * FOXP3) + (STAT6 * FOXP3)))",
    "Src = (Bintegrin + FAK_Tyr397)",
    "IL4R_HIGH = ((IL4 * (IL4RA_HIGH * CGC)) + (IL4_e * (IL4RA_HIGH * CGC)))",
    "Tyk2 = (IL12RB1 * IL12RB2)",
    "IL10 = (NFAT * ((STAT3 + GATA3) * proliferation))",
    "F_Actin = (Arp2_3 * G_Actin)",
    "GAB2 = (Shc1 * Grb2)",
    "IFNBR = IFNB_e",
    "GATA3 = (Dec2 + STAT6 * ~(TBET))",
    "IFNG = ((AP1 * STAT4) * ~((FOXP3 + STAT3)) + ATF2 * ~((FOXP3 + STAT3)) + HLX * ~((FOXP3 + STAT3)) + (RUNX3 * (TBET * proliferation * NFAT)) * ~((FOXP3 + STAT3)) + (STAT4 * (proliferation * NFAT)) * ~((FOXP3 + STAT3)))",
    "RORGT = ((RORGT * (TGFBR + STAT3)) + (TGFBR * STAT3))",
    "FAK_Tyr397 = Bintegrin",
    "IL2R_HIGH = ((IL2 * (IL2RA * CGC * IL2RB)) + (IL2_e * (IL2RB * IL2RA * CGC)))",
    "IKKcomplex = (Bcl10_Carma1_MALTI + NIK + TCR)",
    "SYK = IL2R",
    "BRAF = Rap1",
    "SOCS3 = STAT3",
    "Crk = (Cas + Paxillin)",
    "Galpha_iR = Galpha_iL",
    "EPAC = cAMP",
    "IL15R = (CGC * (IL2RB * IL15_e * IL15RA))",
    "Cdc42 = (C3G + RhoGEF)",
    "SOCS1 = (STAT3 + STAT6)",
    "IL23 = (NFAT * (STAT3 * proliferation))",
    "MEK1_2 = (BRAF + PAK + RAF1)",
    "IL21 = (NFAT * (proliferation * STAT3))",
    "IL22 = (STAT1 + STAT3 + STAT4 + STAT5)",
    "RIAM = Rap1",
    "SHP2 = (GAB2 + IL2RB)",
    "PLCb = Galpha_Q",
    "Profilin = RIAM",
    "NFKB = ~((FOXP3 + IKB)) + ~(FOXP3 + IKB)",
    "IL22R = IL22_e",
    "PAK = (Cdc42 + Nck + rac1)",
    "AKT = PDK1",
    "IL4RA_HIGH = STAT5_HIGH",
    "IL2R = ((IL2 * ((IL2RB * CGC) * ~IL2RA)) + (IL2_e * ((IL2RB * CGC) * ~IL2RA)))",
    "ATF2 = P38",
    "IL12RB2 = IL12_e",
    "JNK = (MEK4 + MKK7 + (rac1 * Crk))",
    "STAT5_HIGH = (IL2R_HIGH + IL4R_HIGH)",
    "IL12RB1 = (IL12_e + IRF1)",
    "MEK4 = MEKK4",
    "Nck = SLP_76",
    "MEK3 = MEKK4",
    "MEK6 = MEKK4",
    "ICOS = APC",
    "Dec2 = GATA3",
    "TRAF6 = IRAK1",
    "RUNX3 = TBET * ~(GATA3)",
    "ITK = SLP_76",
    "IL23R = ((IL23 * (GP130 * STAT3 * RORGT * IL12RB1)) + (IL23_e * (GP130 * STAT3 * RORGT * IL12RB1)))",
    "GSK_3b = ~(AKT) + ~(AKT)",
    "NIK = TRAF6",
    "TBET = (STAT1 * ~(GATA3) + TBET * ~(GATA3))",
    "TGFBR = (TGFB + TGFB_e)",
    "Ca2~ = IP3",
    "SMAD3 = TGFBR",
    "MLC = ROCK",
    "FOXP3 = ((NFAT * (FOXP3 * STAT5)) + (SMAD3 * (NFAT * STAT5)) * ~((STAT1 + (STAT3 * RORGT))))",
    "TCR = (APC * CD28)",
    "Lck = (CD28 + CD4 + (JAK3 * IL2RB))",
    "Vav = SLP_76",
    "CARMA1 = (CD26 + PKC)",
    "LAT = ZAP_70",
    "WAVE_2 = (IRSp53 * rac1)",
    "IP3 = PLCg",
    "MEKK4 = (GADD45B * GADD45G)",
    "PIP3_345 = PI3K",
    "Shc1 = (FYN + (IL2RB * IL2R))",
    "Grb2 = (LAT + Shc1)",
    "MKK7 = TAK1",
    "Bcl10_Carma1_MALTI = (BCL10_Malt1 * CARMA1)",
    "proliferation = (STAT5_HIGH + proliferation)",
    "PKA = cAMP",
    "Calcineurin = Ca2~",
    "IL21R = ((IL21 * (GP130 * CGC)) + (IL21_e * (GP130 * CGC)))",
    "PKC = DAG",
    "cAMP = adenyl_cyclase",
    "NOS2A = CAV1_scaffold",
    "IFNGR = ((IFNG * (IFNGR2 * IFNGR1)) + (IFNG_e * (IFNGR2 * IFNGR1)))",
    "Ras = (RASgrp + Sos)",
    "IL4R = ((IL4 * (IL4RA * CGC)) + (IL4_e * (IL4RA * CGC)))",
    "HLX = TBET",
    "IL10R = ((IL10 * (IL10RA * IL10RB)) + (IL10_e * (IL10RA * IL10RB)))",
    "TGFB = (FOXP3 * (proliferation * NFAT))",
    "Rap1 = ((C3G * Crk) + EPAC + PKA)",
    "N_WASP = (Cdc42 + (Nck * Vav))",
    "IRSp53 = rac1",
    "ERM = STAT4",
    "IRAK1 = IL18R1",
    "Cofilin = ~(LIMK) + ~(LIMK)",
    "IL6R = (GP130 * (IL6RA * IL6_e))",
    "Arp2_3 = (N_WASP + WAVE_2)",
    "CAV1_scaffold = (Bintegrin + CAV1_ACTIVATOR + Src)",
    "GADD45G = (CD3 + IL12_e)",
    "NFAT = ((CD28 * TCR) + (Calcineurin * P38) * ~(GSK_3b) + (TCR * CD28))",
    "ROCK = RhoA",
    "Galpha12_13R = alpha_13L",
    "Gads = LAT",
    "GADD45B = (IL12_e * TCR)",
    "Bintegrin = (ECM + TCR)",
    "Sos = Grb2",
    "TAK1 = TRAF6",
    "PLCg = (ITK + LAT + ZAP_70)",
    "rac1 = (was + (Crk * Paxillin) + NOS2A + Vav)",
    "IL4RA = ~(STAT5_HIGH) + ~(STAT5_HIGH)",
    "AP1 = (ERK + JNK + STAT4)",
    "PI3K = ((CD28 * ICOS) + FAK_576_577 + GAB2 + IL2R + Ras + SHP2)",
    "was = Src",
    "Cas = (FAK_576_577 * Bintegrin)",
    "STAT6 = IL4R",
    "STAT4 = (JAK2 * ~(GATA3) + (P38 * Tyk2) * ~(GATA3))",
    "STAT5 = (IL15R + IL2R + IL4R + JAK1 + Lck + SYK)",
    "BCL10_Malt1 = CARMA1",
    "SLP_76 = (Gads + ZAP_70)",
    "RhoA = (CAV1_scaffold + RhoGEF)",
    "CD4 = (TCR * (MHC_II * CD3))",
    "CD3 = TCR",
    "GFI1 = (STAT6 + TCR)",
    "CD26 = CAV1_scaffold",
    "CD28 = (APC + B7)",
    "IL4 = ((GATA3 * (proliferation * NFAT)) * ~((FOXP3 + IRF1 + (TBET * RUNX3))) + IRF4)",
    "PDK1 = PIP3_345",
    "IL18R1 = IL18_e",
    "RhoGEF = (FAK_576_577 + Galpha12_13R)",
    "IL2RA = ((FOXP3 * NFAT) + (NFKB * NFAT) + (SMAD3 * NFAT) + (STAT5 * NFAT))",
    "FAK_576_577 = (FAK_Tyr397 * Src)",
    "ERK = MEK1_2",
    "Paxillin = FAK_576_577",
    "Galpha_Q = Galpha_QL",
    "RAF1 = Ras",
    "P38 = (MEK3 + MEK6)",
    "STAT1 = (IFNBR * ~(SOCS1) + IFNGR * ~(SOCS1) + IL27R * ~(SOCS1))",
    "G_Actin = Profilin",
    "STAT3 = (IL10R + IL21R + IL23R + IL27R + IL6R)",
    "IL27R = (GP130 * (IL27RA * IL27_e))",
    "IKB = ~(IKKcomplex) + ~(IKKcomplex)",
    "GalphaS_R = GalphaS_L",
    "FYN = (CAV1_scaffold + (CD3 * TCR))",
    "LIMK = (PAK + ROCK)",
    "IRF1 = STAT1",
    "RASgrp = DAG",
    "JAK1 = (IL22R * ~(SOCS3) + IL2R * ~(SOCS3) + IL9R * ~(SOCS3) + JAK3 * ~(SOCS3))",
    "JAK2 = (IL12RB1 * IL12RB2)",
    "ZAP_70 = (ITAMS * CD3)",
    "C3G = Crk",
    "JAK3 = IL2R",
    "IRF4 = GATA3",
    "IL2 = ((NFAT * ~FOXP3) * ~(((STAT5 * STAT6) + (TBET * NFKB))) + NFKB * ~(((STAT5 * STAT6) + (TBET * NFKB))))"
];


// console.log(ccbooleananalysis._getGraph(lacOperon).data);
// console.log(ccbooleananalysis.functionalCircuits(guardCellAbcisic));
// console.log(ccbooleananalysis.feedbackLoops(guardCellAbcisic));
// console.log(ccbooleananalysis.connectivityInDegree(mammalianCellCycle));
// console.log(ccbooleananalysis.connectivityOutDegree(mammalianCellCycle));


// const eq = "IRAK_TRAF6 + RIPK1_TRAF6";
// const eq = "(~ Calcium_cyt_b1 * ~ IP3R1 * ~ SERCA * ORAI1) + (~ Calcium_cyt_b1 * ~ IP3R1 * SERCA * ORAI1 * ~ PMCA) + (~ Calcium_cyt_b1 * IP3R1 * ~ SERCA * ~ ORAI1 * ~ PMCA) + (~ Calcium_cyt_b1 * IP3R1 * ~ SERCA * ORAI1) + (~ Calcium_cyt_b1 * IP3R1 * SERCA * ~ PMCA) + (Calcium_cyt_b1 * ~ Calcium_cyt_b2 * ~ IP3R1 * ~ SERCA * ~ ORAI1 * ~ PMCA) + (Calcium_cyt_b1 * ~ Calcium_cyt_b2 * ~ IP3R1 * ~ SERCA * ORAI1) + (Calcium_cyt_b1 * ~ Calcium_cyt_b2 * ~ IP3R1 * SERCA * ORAI1 * ~ PMCA) + (Calcium_cyt_b1 * ~ Calcium_cyt_b2 * IP3R1 * ~ SERCA * ~ ORAI1 * ~ PMCA) + (Calcium_cyt_b1 * ~ Calcium_cyt_b2 * IP3R1 * ~ SERCA * ORAI1) + (Calcium_cyt_b1 * ~ Calcium_cyt_b2 * IP3R1 * SERCA * ~ PMCA) + (Calcium_cyt_b1 * Calcium_cyt_b2)";
// const eq = "(WAVE_cplx * ~ Calcium_cyt_b1 * STIM1) + (WAVE_cplx * Calcium_cyt_b1 * ~ Calcium_cyt_b2 * STIM1) + (WAVE_cplx * Calcium_cyt_b1 * Calcium_cyt_b2 * STIM1 * Mitochondria)";

/*const eqs = [
  "IP3",
  "ZAP70 * Calcium_cyt_b1",
  "~ Calcium_ER",
  "(WAVE_cplx * ~ Calcium_cyt_b1 * STIM1) + (WAVE_cplx * Calcium_cyt_b1 * ~ Calcium_cyt_b2 * STIM1) + (WAVE_cplx * Calcium_cyt_b1 * Calcium_cyt_b2 * STIM1 * Mitochondria)",
  "(~ Calcium_cyt_b1 * ~ IP3R1 * ~ SERCA * ORAI1) + (~ Calcium_cyt_b1 * ~ IP3R1 * SERCA * ORAI1 * ~ PMCA) + (~ Calcium_cyt_b1 * IP3R1 * ~ SERCA * ~ ORAI1 * ~ PMCA) + (~ Calcium_cyt_b1 * IP3R1 * ~ SERCA * ORAI1) + (~ Calcium_cyt_b1 * IP3R1 * SERCA * ~ PMCA) + (Calcium_cyt_b1 * ~ Calcium_cyt_b2 * ~ IP3R1 * ~ SERCA * ~ ORAI1 * ~ PMCA) + (Calcium_cyt_b1 * ~ Calcium_cyt_b2 * ~ IP3R1 * ~ SERCA * ORAI1) + (Calcium_cyt_b1 * ~ Calcium_cyt_b2 * ~ IP3R1 * SERCA * ORAI1 * ~ PMCA) + (Calcium_cyt_b1 * ~ Calcium_cyt_b2 * IP3R1 * ~ SERCA * ~ ORAI1 * ~ PMCA) + (Calcium_cyt_b1 * ~ Calcium_cyt_b2 * IP3R1 * ~ SERCA * ORAI1) + (Calcium_cyt_b1 * ~ Calcium_cyt_b2 * IP3R1 * SERCA * ~ PMCA) + (Calcium_cyt_b1 * Calcium_cyt_b2)",
  "~ Calcium_ER * Calcium_cyt_b1",
  "(Calcium_cyt_b1 * ~ Calcium_cyt_b2 * ~ SERCA * ORAI1) + (Calcium_cyt_b1 * ~ Calcium_cyt_b2 * SERCA * ORAI1 * ~ PMCA) + (Calcium_cyt_b1 * Calcium_cyt_b2 * ~ SERCA * ~ ORAI1 * ~ PMCA) + (Calcium_cyt_b1 * Calcium_cyt_b2 * ~ SERCA * ORAI1) + (Calcium_cyt_b1 * Calcium_cyt_b2 * SERCA * ~ PMCA)",
  "Calcium_cyt_b1 * ~ Mitochondria",
  "(~ Calcium_ER * ~ IP3R1 * SERCA) + (Calcium_ER * ~ IP3R1)"
];
*/

/*
var eqs = [
    "(sa1102 * sa1103) + sa1102"
];
*/

var eqs = [
//  "((S_10 * (~ (S_13) + S_10)) * ~ ((S_12 + S_15))) + ~ (( ((S_13 + S_15) + S_12) + S_10))",
//  "((S_10 * (~ (S_13) + S_10)) * ~ ((S_12 + S_15))) + ~ ((((S_13 + S_15) + S_12) + S_10))",
//  "a * b + a",
,'((((((((S_104 * ((S_63 + S_111) + S_147)) * S_109) + (S_109 * ((S_63 + S_111) + S_147))) + (S_63 * S_152)) + (S_152 * ((S_63 + S_111) + S_147))) + ((S_26 * S_109) * ((S_63 + S_111) + S_147))) + (S_147 * S_152)) + (S_111 * S_152)) + ((S_43 * (S_152 + S_109)) * ((S_63 + S_111) + S_147))'
];


eqs.forEach((eq) => {
  console.log("parsing "+eq);
  console.log(JSON.stringify(ccbooleananalysis.getBiologicalConstructs(eq), null, 2));
})

var eqs_v2 = [  
//,'((((((((((((((((((((((((S_217 * (S_164 * S_27)) + (S_245 * (S_27 * S_164))) + (S_27 * S_164)) + (S_223 * (S_164 * S_27))) + (S_34 * (S_164 * S_27))) + (S_91 * (S_164 * S_27))) + (S_129 * (S_27 * S_164))) + (S_116 * (S_27 * S_164))) + (S_41 * (S_27 * S_164))) + (S_96 * (S_164 * S_27))) + (S_164 * ((S_193 * S_277) * S_27))) + (S_277 * ((S_164 * S_27) * S_193))) + (S_152 * (S_164 * S_27))) + (S_23 * (S_27 * S_164))) + (S_105 * (S_27 * S_164))) + (S_103 * (S_164 * S_27))) + (S_9 * (S_27 * S_164))) + (S_7 * (S_27 * S_164))) + (S_255 * (S_27 * S_164))) + (S_189 * (S_164 * S_27))) + (S_25 * (S_27 * S_164))) + (S_193 * ((S_164 * S_27) * S_277))) + (S_37 * (S_27 * S_164))) + (S_4 * (S_164 * S_27))) + (S_55 * (S_27 * S_164))'
,'((((((((S_104 * ((S_63 + S_111) + S_147)) * S_109) + (S_109 * ((S_63 + S_111) + S_147))) + (S_63 * S_152)) + (S_152 * ((S_63 + S_111) + S_147))) + ((S_26 * S_109) * ((S_63 + S_111) + S_147))) + (S_147 * S_152)) + (S_111 * S_152)) + ((S_43 * (S_152 + S_109)) * ((S_63 + S_111) + S_147))'
]

//node --stack-size=15000 --max-old-space-size=10096 tests/testfunc.js
eqs_v2.forEach((eq) => {
  console.log("Parsing V2: "+eq,"\n");
  console.log(JSON.stringify(
    ccbooleananalysis.getBiologicalConstructs(eq)
  , null, 2));
})
