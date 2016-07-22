// State transition

ccBooleanAnalysis._evaluateState = function(expression, regexes) {
  // convert the expression into a parseable form
  // regexes are regular expression forms of the assignments.
  // This function could compute the regexes based on the assignments,
  // but as this function is likely to be called many times with the same assignment,
  // the function requests precomputed regexes.
  //
  // These regexes can be generated with ccBooleanAnalysis._getRegexes(assignments).
  var mapObj = {
    'OR':'||',
    'AND':'&&',
    '~':'!'
  };

  var parsable_expression = expression.replace(/AND|OR|~/gi, function(matched){
    return mapObj[matched];
  });

  // insert the assignments into the parsable_expression
  parsable_expression = this._applyRegexes(parsable_expression, regexes);
  return eval(parsable_expression);
}

ccBooleanAnalysis._applyRegexes = function(parsable_expression, regexes) {
  // This expression should be parsable (i.e. have &&, ||, etc.)
  // regexes / assignments should be generated using ccBooleanAnalysis._getRegexes.
  // This function applies those regexes to an expression.
  for (var i = 0; i < regexes.length; i++) {
    var regex = regexes[i];

    parsable_expression = parsable_expression.replace(regex[0], regex[1]);
  }
  return parsable_expression;
}

ccBooleanAnalysis._getRegexes = function(assignments) {
  // generate the appropriate regular expressions that can be applied
  // to a parseable expression so that an evaluation gives the updated
  // state of the term.
  //
  // Note that assignments should be a hashmap where keys are the
  // the variables; and values are booleans of the desired state.
  //
  // Each term of the array includes another array.
  // The first term of this inner array is the regular expression.
  // The second term of the array is the assignment that should be made.
  // The assignment is represented as a boolean.
  var regexes = [];
  for (key in assignments) {
    var assignment = assignments[key];
    var re = new RegExp(key, 'g');
    regexes.push([re, assignment.toString()]);
  }
  return regexes;
}

ccBooleanAnalysis.evaluateStateTransition = function(equations, assignments) {
  var regexes = this._getRegexes(assignments);
  var new_assignments = {};
  for (var i = 0; i < equations.length; i++) {
    var equation = equations[i];
    var sides = equation.split('=');
    new_assignments[sides[0]] = this._evaluateState(sides[1], regexes);
  }

  return new_assignments;
}

ccBooleanAnalysis.stateTransitionGraph = function(equations) {
  // First, grab all the terms in the equations.
  var terms = [];
  for (var i = 0; i < equations.length; i++) {
    var equation = equations[i];
    terms.push(equation.split('=')[0]);
  }

  // Iterate through each possible combination of assignments
  // transitions is an array.
  // each element is an array of length 2.
  // The first entry is the starting assignments.
  // The second entry is the ending assignments.
  var transitions = [];

  // In order to compute the truth table, we count
  // to 2^(equations.length - 1) in binary.
  // Each digit of this binary expression gives the setting
  // of a term in the evaluation.
  for (var i = 0; i < (2 << equations.length); i++) {
    var settings = i.toString(2);
    var assignments = {};
    for (var j = 0; j < terms.length; j++) {
      var term = terms[j];
      if (j < settings.length) {
        if (settings[j] == 1) {
          assignments[term] = true;
        } else {
          assignments[term] = false;
        }
      } else {
        assignments[term] = false;
      }
    }
    var new_assignments = this.evaluateStateTransition(equations, assignments);
    transitions.push([assignments, new_assignments]);
  }

  return transitions;
}
