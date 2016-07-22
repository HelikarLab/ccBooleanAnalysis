/*
 * Accepts a parse_tree created using jsep library.
 * http://jsep.from.so/
 *
 * Vanilla conversion algorithm:
 * 1) Convert to negation normal form
 *    a) ~(A or B) --> ~A and ~B
 *    b) ~(A and B) --> ~A or ~B
 *    c) ~(~A) --> A
 *
 * 2) Distribute AND over ORs.
 *    - A and (B or C) --> (A and B) or (A and C)
 *
 * Recursively apply these techniques to reach DNF.
 */

ccBooleanAnalysis.getRegulators = function(parse_tree) {
  // Private helpers
  var iterateAndTree = function(positive_holder, negative_holder, parse_tree) {
    if (parse_tree.type == ccBooleanAnalysis._constants.kIdentifier) {
      positive_holder.data.push(parse_tree.name);
    } else if (parse_tree.type == ccBooleanAnalysis._constants.kUnaryExpression) {
      negative_holder.data.push(parse_tree.argument.name);
    } else {
     iterateAndTree(positive_holder, negative_holder, parse_tree.left);
     iterateAndTree(positive_holder, negative_holder, parse_tree.right);
    }
  }

  var iterateOrTree = function(positive_holder, negative_holder, parse_tree) {
    if (parse_tree.operator == ccBooleanAnalysis._constants.kAND) {
      var and_positive_holder = {data: []};
      var and_negative_holder = {data: []};
      iterateAndTree(and_positive_holder, and_negative_holder, parse_tree);

      // Setup positive regulators
      if (and_positive_holder.data.length > 0) {
        var first_positive_name = and_positive_holder.data[0];
        if (!(first_positive_name in positive_holder.data)) {
          positive_holder.data[first_positive_name] = {
            component: first_positive_name,
            type: true,
            conditionRelation: true,
            conditions: [],
          };
        }
        var condition_components = [];
        for (var i = 1; i < and_positive_holder.data.length; i++) {
          condition_components.push(and_positive_holder.data[i]);
        }
        positive_holder.data[first_positive_name].conditions.push({
          state: true, // active
          type: true, // if/when
          components: condition_components
        });
      }

      // Setup negative regulators
      for (var i = 0; i < and_negative_holder.data.length; i++) {
        if (!(and_negative_holder.data[i] in negative_holder)) {
          negative_holder.data[and_negative_holder.data[i]] = {
            component: and_negative_holder.data[i],
            type: false,
            dominants: []
          };
        }
        if (and_positive_holder.length > 0) {
          negative_holder.data[and_negative_holder.data[i]].dominants.push(positive_holder.data[first_positive_name]);
        }
      }
    } else if (parse_tree.type == ccBooleanAnalysis._constants.kIdentifier) {
      // Add a positive regulator with no conditions
      var positive_regulator_name = parse_tree.name;
      if (!(positive_regulator_name in positive_holder.data)) {
        positive_holder.data[positive_regulator_name] = {
          component: positive_regulator_name,
          type: true
        };
      }
    } else if (parse_tree.type == ccBooleanAnalysis._constants.kUnaryExpression) {
      // Add a negative regulator with no conditions
      var negative_regulator_name = parse_tree.argument.name;
      if (!(negative_regulator_name in negative_holder.data)) {
        negative_holder.data[negative_regulator_name] = {
          component: negative_regulator_name,
          type: true
        };
      }
    } else { // kOR
      iterateOrTree(positive_holder, negative_holder, parse_tree.left);
      iterateOrTree(positive_holder, negative_holder, parse_tree.right);
    }
  }

  // Main Logic
  positive_holder = {data: {}};
  negative_holder = {data: {}};

  iterateOrTree(positive_holder, negative_holder, parse_tree);

  var regulators = [];
  for (var key in positive_holder.data) {
    regulators.push(positive_holder.data[key]);
  }
  for (var key in negative_holder.data) {
    regulators.push(negative_holder.data[key]);
  }

  return regulators;
}

ccBooleanAnalysis._getTerms = function(parse_tree, terms) {
  if (parse_tree.operator == ccBooleanAnalysis._constants.kAND || parse_tree.operator == ccBooleanAnalysis._constants.kOR) {
    this._getTerms(parse_tree.left, terms);
    this._getTerms(parse_tree.right, terms);
  } else if (parse_tree.type == ccBooleanAnalysis._constants.kUnaryExpression) {
    this._getTerms(parse_tree.argument, terms);
  } else if (parse_tree.type == ccBooleanAnalysis._constants.kIdentifier) {
    terms.data.push(parse_tree.name);
  }
}

ccBooleanAnalysis.getBiologicalConstructs = function(s) {
  // First, check for absent state
  // If structure is A OR ~B:
  //    get all terms in A
  //    get all terms in B
  // If the two arrays are the same:
  //    then set parse tree = A and absentState = false
  // Else:
  //    then set parse tree = original parse tree, absentState = true

  var pt = this.getParseTree(s);
  var absentState = false;
  if (pt.operator == ccBooleanAnalysis._constants.kOR && pt.right.type == ccBooleanAnalysis._constants.kUnaryExpression) {
    data_left = {'data': []};
    data_right = {'data': []};

    this._getTerms(pt.left, data_left);
    this._getTerms(pt.right.argument, data_right);

    var isSuperset = data_left.data.every(function(val) { return data_right.data.indexOf(val) >= 0; });

    if (isSuperset) {
      pt = pt.left;
      absentState = true;
    }
  }

  // Continue with whatever parse_tree and absentState we have
  this._convertToNegationForm(pt);
  this._pushDownAnds(pt);
  var regulators = this.getRegulators(pt);
  return {
    regulators: regulators,
    absentState: absentState
  };
}
