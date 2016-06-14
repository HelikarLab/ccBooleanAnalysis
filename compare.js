// Compare v2
// We are going to try converting to DNF as per our other code.
// Then, sort by terms and then by conjuctions. Gives canonical form.

ccBooleanAnalysis.compareBooleans = function(s1, s2) {
  var getDNFStringEncoding = function(parse_tree) {
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

    var iterateOrTree = function(conjuctions, parse_tree) {
      if (parse_tree.type == ccBooleanAnalysis._constants.kIdentifier) {
        var encoding = parse_tree.name;
        conjuctions.data.push(encoding);
      } else if (parse_tree.operator == ccBooleanAnalysis._constants.kAND) {
        var and_positive_holder = {data: []};
        var and_negative_holder = {data: []};
        iterateAndTree(and_positive_holder, and_negative_holder, parse_tree);
        and_positive_holder.data.sort();
        and_negative_holder.data.sort();

        var encoding = "";
        encoding += and_positive_holder.data.join("%");

        if (and_negative_holder.data.length > 0) {
          encoding += "~" + and_negative_holder.data.join("%");
        }

        conjuctions.data.push(encoding);
      } else if (parse_tree.type == ccBooleanAnalysis._constants.kUnaryExpression) {
        // Add a negative regulator with no conditions
        var encoding = "~" + parse_tree.argument.name;
        conjuctions.data.push(encoding);
      } else { // kOR
        iterateOrTree(conjuctions, parse_tree.left);
        iterateOrTree(conjuctions, parse_tree.right);
      }
    }

    // Main Logic
    conjuctions = {data: []};
    iterateOrTree(conjuctions, parse_tree);
    conjuctions.data.sort();
    var final_encoding = conjuctions.data.join("|");
    return final_encoding;
  }

  // First, convert the booleans into parse trees.
  var pt1 = this.getParseTree(s1);
  var pt2 = this.getParseTree(s2);

  this._convertToNegationForm(pt1);
  this._convertToNegationForm(pt2);

  this._pushDownAnds(pt1);
  this._pushDownAnds(pt2);

  var encoding1 = getDNFStringEncoding(pt1);
  var encoding2 = getDNFStringEncoding(pt2);

  return encoding1 == encoding2;
}
