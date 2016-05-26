/*
 * Compares two Boolean functions.
 *
 * The input are two strings representing Boolean functions.
 * The objective is to compare whether the two functions
 * are equivalent.
 *
 * Syntax of a recursive notation representing the functions:
 * cf. http://zoo.cs.yale.edu/classes/cs201/Fall_2015/lectures/0930.html
 *
 * (Base cases)
 *    0 is a Boolean expression
 *    1 is a Boolean expression
 *    x is a Boolean expression, for any variable x
 *
 * (Primitive cases)
 * If p and q are Boolean expressions, then so are:
 *    !(p)       NOT operator
 *    (p q)   AND operator
 *    (p + q)   OR  operator
 *
 * (Derived cases)
 *    (p xor q)   XOR operator === (p * q') + (p' * q)
 *    (p > q)   --> operator === (p' + q)
 *    (p = q)  <--> operator === (p > q) * (q > p) === (p' + q) * (q' + p)
 *
 * For now, we are not parsing derived cases.
 *
 * We use these derived cases because the Javascript && and || operators
 * are short-circuiting. This significantly reduces computational load.
 *
 * (Order of operations)
 * ', *, +
 *
 * (Algorithm)
 *
 * 1. Build boolean representation.
 * 2. Evaluate truth table.
 * 3. Iterate through all contexts of the variables.
 *    If the results don't match between the two formuals, fail.
 * 4. return true.
 *
 */

// Helpers for recursively truth combinations
var all_truths = [];
var generateCombinationsHelper = function(n, i, truths) {
  // Default parameters
  var i = typeof i !== 'undefined' ?  i : 0;
  var truths = typeof truths !== 'undefined' ?  truths : [];

  // Base case
  if (truths.length == n) {
    all_truths.push(truths);
    return;
  }

  // Recursive steps
  truths[i] = true;
  generateCombinationsHelper(n, 1 + i, truths);
  truths[i] = false;
  generateCombinationsHelper(n, 1 + i, truths);
}

var generateCombinations = function(n) {
  all_truths = [];
  generateCombinationsHelper(n);
  return all_truths.slice();
}

var compareBooleans = function (s1, s2) {
  // Parse data
  var data1 = truthTable.parse(s1);
  var data2 = truthTable.parse(s2);

  // Compute venn diagram of arrays
  var seen = {};

  for (i = 0; i < data1.params.length; i++) {
    var x = data1.params[i];
    seen[x] = 1;
  }

  for (i = 0; i < data2.params.length; i++) {
    var x = data2.params[i];
    if (!(x in seen)) {
      seen[x] = 2;
    } else {
      seen[x] += 2;
    }
  }

  // Find the unique positions
  // Positions of unique variables
  unique_pos1 = [];
  unique_pos2 = [];

  // number of shared variables
  shared_count = 0;
  for (i = 0; i < data1.params.length; i++) {
    var x = data1.params[i];
    if (seen[x] == 1) {
      unique_pos1.push(i);
    }
  }

  for (i = 0; i < data2.params.length; i++) {
    var x = data2.params[i];
    if (seen[x] == 2) {
      unique_pos2.push(i);
    } else if (seen[x] == 3) {
      shared_count += 1;
    }
  }

  // Confirm unique variables can be assigned any value.
  var base_truths = generateCombinations(data1.params.length - 1);
  for (i = 0; i < unique_pos1.length; i++) {
    var pos = unique_pos1[i];
    for (j = 0; j < base_truths.length; j++) {
      var truths = base_truths[j].slice();

      // At the index of the unique variable, test for true and false.
      // Assert same result in each case, i.e. variable has no effect
      // on result
      truths.splice(pos, 0, true);
      var result1 = data1.fn.apply(this, truths);
      truths[pos] = false;
      var result2 = data1.fn.apply(this, truths);
      if (result1 != result2) {
        return false;
      }
    }
  }

  // Do the same for data2
  var base_truths = generateCombinations(data2.params.length - 1);
  for (i = 0; i < unique_pos2.length; i++) {
    var pos = unique_pos2[i];
    for (j = 0; j < base_truths.length; j++) {
      var truths = base_truths[j].slice();

      // At the index of the unique variable, test for true and false.
      // Assert same result in each case, i.e. variable has no effect
      // on result
      truths.splice(pos, 0, true);
      var result1 = data2.fn.apply(this, truths);
      truths[pos] = false;
      var result2 = data2.fn.apply(this, truths);
      if (result1 != result2) {
        return false;
      }
    }
  }

  // If we reach this point, we have validated that
  // the parity at the unique indices can be assigned
  // an arbitrary value.
  // Now, we confirm that the truth tables over the shared
  // variables are equivalent.
  var base_truths = generateCombinations(shared_count);
  for (i = 0; i < base_truths.length; i++) {
    var truths1 = base_truths[i].slice();
    var truths2 = base_truths[i].slice();

    // Splice in arbitrary values at unique indices
    for (j = 0; j < unique_pos1.length; j++) {
      var pos = unique_pos1[j];
      truths1.splice(pos, 0, true);
    }

    for (j = 0; j < unique_pos2.length; j++) {
      var pos = unique_pos2[j];
      truths2.splice(pos, 0, true);
    }

    // Confirm truth tables are equivalent
    var result1 = data1.fn.apply(this, truths1);
    var result2 = data2.fn.apply(this, truths2);

    if (result1 != result2) {
      return false;
    }
  }

  // If never encountered a difference in the truth tables,
  // then the boolean functions are equivalent
  return true;
}
