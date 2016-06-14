/*
 * Unit Tests
 */

ccBooleanAnalysis.setup();

QUnit.test("hello world", function(assert) {
  assert.ok(1 == "1", "Passed!");
});

// Boolean Comparisons
var comparisons = [
  ["x", "x", true],
  ["x", "y", false],
  ["x OR y", "y OR x", true],
  ["x AND y", "y AND x", true],
  ["(NOT x)", "x", false],
  ["NOT (x AND y)", "(NOT x) OR (NOT y)", true],
  ["NOT (x OR y)", "(NOT x) AND (NOT y)", true],
  ["(x)", "x", true],
  ["((x))", "x", true],
  ["NOT (x)", "NOT x", true],
  ["NOT (NOT (x))", "x", true],
  ["((A) AND (C OR D))", "(A AND C) OR (A AND D)", true],
  ["(A) AND (NOT (C OR D))", "A AND (NOT C) AND (NOT D)", true],
];

QUnit.test("Boolean comparisons", function(assert) {
  for (var i = 0; i < comparisons.length; i++) {
    var comp = comparisons[i];
    var msg = "";
    if (comp[2] == true) {
      msg = comp[0] + " == " + comp[1];
    } else {
      msg = comp[0] + " != " + comp[1];
    }
    assert.ok(ccBooleanAnalysis.compareBooleans(comp[0], comp[1]) == comp[2], msg);
  }
});
