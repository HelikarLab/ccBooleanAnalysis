/*
 * Unit Tests
 */

QUnit.test("hello world", function(assert) {
  assert.ok(1 == "1", "Passed!");
});

// Boolean Comparisons
var comparisons = [
  ["x", "x", true],
  ["x", "y", false],
  ["x + y", "y + x", true],
  ["x y", "y x", true],
  ["!x", "x", false],
  ["!(x y)", "!x + !y", true],
  ["!(x+y)", "(!x)(!y)", true],
  ["(x)", "x", true],
  ["((x))", "x", true],
  ["!(x)", "!x", true],
  ["!(!(x))", "x", true]
];

QUnit.test("Boolean comparisons", function(assert) {
  for (var i = 0; i < comparisons.length; i++) {
    var comp = comparisons[i];
    var msg = "";
    if (comp[2] == true) {
      msg = comp[0] + " == " + comp[1];
    } else {
      msg = comp[0] + " != " + comp[2];
    }
    assert.ok(compareBooleans(comp[0], comp[1]) == comp[2], msg);
  }
});
