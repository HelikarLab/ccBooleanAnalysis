// Methods for restructuring Boolean expressions

ccBooleanAnalysis._constants = {
  kNOT: '~',
  kAND: '*',
  kOR: '+',
  kBinaryExpression: "BinaryExpression",
  kUnaryExpression: "UnaryExpression",
  kIdentifier: "Identifier"
};

ccBooleanAnalysis._constructNegation = function(parse_tree) {
  return {
    argument: parse_tree,
    operator: this._constants.kNOT,
    prefix: true,
    type: this._constants.kUnaryExpression
  };
}

ccBooleanAnalysis._constructAND = function(left, right) {
  return {
    left: left,
    right: right,
    operator: this._constants.kAND,
    type: this._constants.kBinaryExpression
  };
}

// Negate an expression
ccBooleanAnalysis._negate = function(parse_tree) {
  if (parse_tree.type == this._constants.kIdentifier) {
    return this._constructNegation(parse_tree);
  } else if (parse_tree.operator == this._constants.kNOT) {
    return parse_tree.argument;
  } else if (parse_tree.operator == this._constants.kOR) {
    parse_tree.operator = this._constants.kAND;
    parse_tree.left = this._negate(parse_tree.left);
    parse_tree.right = this._negate(parse_tree.right);
    return parse_tree;
  } else if (parse_tree.operator == this._constants.kAND) {
    parse_tree.operator = this._constants.kOR;
    parse_tree.left = this._negate(parse_tree.left);
    parse_tree.right = this._negate(parse_tree.right);
    return parse_tree;
  }
}

// Applies demorgan's rule for non-trivial cases
ccBooleanAnalysis._convertToNegationForm = function(parse_tree) {
  if (parse_tree.type == this._constants.kIdentifier) {
    return;
  } else if (parse_tree.operator == this._constants.kNOT) {
    // Copy the argument's negation into the parse tree
    if (parse_tree.argument.type == this._constants.kIdentifier) {
      return;
    } else {
      new_parse_tree = this._negate(parse_tree.argument);
      for (var k in new_parse_tree) {
        parse_tree[k] = new_parse_tree[k];
      }
    }
  } else {
    this._convertToNegationForm(parse_tree.left);
    this._convertToNegationForm(parse_tree.right);
  }
}

// Distribute ANDs across ORs
ccBooleanAnalysis._pushDownAnds = function(parse_tree) {
  if (parse_tree.operator == this._constants.kAND) {
    if (parse_tree.right.operator == this._constants.kOR) {
      var old_left = parse_tree.left;
      parse_tree.left = this._constructAND(old_left, parse_tree.right.left);
      parse_tree.right = this._constructAND(old_left, parse_tree.right.right);
      parse_tree.operator = this._constants.kOR;
    }
    else if (parse_tree.left.operator == this._constants.kOR) {
      var old_right = parse_tree.right;
      parse_tree.right = this._constructAND(parse_tree.left.right, old_right);
      parse_tree.left = this._constructAND(parse_tree.left.left, old_right);
      parse_tree.operator = this._constants.kOR;
    }
    this._pushDownAnds(parse_tree.left);
    this._pushDownAnds(parse_tree.right);
  }
  else if (parse_tree.operator == this._constants.kOR) {
    this._pushDownAnds(parse_tree.left);
    this._pushDownAnds(parse_tree.right);
  }
    // Negations and terminals are terminating cases
}

// Get all positive and negative variables
// structure terms as: { data: { positive: [], negative: [] } }
// Must be in negation form to work properly
ccBooleanAnalysis._sortTerms = function(parse_tree, terms) {
  if (parse_tree.operator == this._constants.kAND || parse_tree.operator == this._constants.kOR) {
    this._sortTerms(parse_tree.left, terms);
    this._sortTerms(parse_tree.right, terms);
  } else if (parse_tree.type  == this._constants.kIdentifier) {
    terms.data.positive.push(parse_tree.name);
  } else if (parse_tree.operator == this._constants.kNOT) {
    terms.data.negative.push(parse_tree.argument.name);
  }
}
