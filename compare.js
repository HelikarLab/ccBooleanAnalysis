// Compare v2
// We are going to try converting to DNF as per our other code.
// Then, sort by terms and then by conjuctions. Gives canonical form.

ccBooleanAnalysis.getDNFStringEncoding = function(s) {

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
      conjuctions.data.push([[parse_tree.name], []]);
    } else if (parse_tree.operator == ccBooleanAnalysis._constants.kAND) {
      var and_positive_holder = {data: []};
      var and_negative_holder = {data: []};
      iterateAndTree(and_positive_holder, and_negative_holder, parse_tree);

      and_positive_holder.data = and_positive_holder.data.filter(ccBooleanAnalysis._uniqueFilter).sort();
      and_negative_holder.data = and_negative_holder.data.filter(ccBooleanAnalysis._uniqueFilter).sort();

      // if you have a term in both pos and neg,
      // then the expresion evaluates to "false."
      // Since (false OR X) == X,
      // we don't have to add "false" to the set of conjuctions..
      if (!(ccBooleanAnalysis._shares_term(and_positive_holder.data, and_negative_holder.data))) {
        conjuctions.data.push([and_positive_holder.data, and_negative_holder.data]);
      }
    } else if (parse_tree.type == ccBooleanAnalysis._constants.kUnaryExpression) {
      conjuctions.data.push([[], [parse_tree.argument.name]]);
    } else { // kOR
      iterateOrTree(conjuctions, parse_tree.left);
      iterateOrTree(conjuctions, parse_tree.right);
    }
  }

  // Convert parse tree format to DNF
  var parse_tree = this.getParseTree(s);
  this._convertToNegationForm(parse_tree);
  this._pushDownAnds(parse_tree);

  // Main Logic
  conjuctions = {data: []};
  iterateOrTree(conjuctions, parse_tree);

  for (var i = 0; i < conjuctions.data.length; i++) {
    var conjuction_a = conjuctions.data[i];

    // If a conjuction is a subpart of another one (considering negations),
    // then discard the larger one.
    for (var j = i + 1; j < conjuctions.data.length; j++) {
      var conjuction_b = conjuctions.data[j];
      var subset = [ccBooleanAnalysis._is_subset(conjuction_a[0], conjuction_b[0]), ccBooleanAnalysis._is_subset(conjuction_a[1], conjuction_b[1])];
      if (subset[0] == 2 && subset[1] == 2) {
        // throw away conjuction_a
        conjuctions.data.splice(i, 1);
        i--; j--;
        break; // start over the j's on the next i.
      } else if (subset[0] == 1 && subset[1] == 1) {
        // throw away conjuction_b
        conjuctions.data.splice(j, 1);
        j--;
      }
    }
  }

  var conjuctions_hashtable = {};
  for (var i = 0; i < conjuctions.data.length; i++) {
    var conjuction = conjuctions.data[i];
    var key = this._get_union(conjuction[0], conjuction[1]).join('');

    var no_collision = true;
    if (key in conjuctions_hashtable) {
      var collisions = conjuctions_hashtable[key];
      for (var j = 0; j < collisions.length; j++) {
        var collision = collisions[j];

        // heuristic to avoid taking intersection in every case
        var collision_has_neg = ((collision[0].length == conjuction[0].length - 1) && (collision[1].length == conjuction[0].length + 1));
        var conjuction_has_neg = ((collision[0].length == conjuction[0].length + 1) && (collision[1].length == conjuction[0].length - 1));

        if (collision_has_neg || conjuction_has_neg) {
          if (collision_has_neg) {
            var conjuction_a = conjuction.slice();
            var conjuction_b = collision.slice();
          } else {
            var conjuction_a = collision.slice();
            var conjuction_b = conjuction.slice();
          }

          // get and remove this intersection
          var intersection = [this._remove_intersection(conjuction_a[0], conjuction_b[0]), this._remove_intersection(conjuction_a[1], conjuction_b[1])];

          // confirm that the only difference is a term switched from pos to neg
          if (conjuction_a[0].length == 1 && conjuction_a[1].length == 1 && conjuction_b[1].length == 1 && conjuction_b[0].length == 1 && conjuction_a[0][0] ==   conjuction_b[1][0]) {
            no_collision = false; // mark that we've had a collision

            // remove the collision
            conjuctions_hashtable[key].splice(j, 1);
            j--;

            var new_key = this._get_union(intersection[0], intersection[1]).join('');
            if (new_key in conjuctions_hashtable) {
              conjuctions_hashtable[new_key].push(intersection);
            } else {
              conjuctions_hashtable[new_key] = [intersection];
            }
          }
        }
      }
    } else {
      conjuctions_hashtable[key] = [];
    }
    if (no_collision) {
      conjuctions_hashtable[key].push(conjuction);
    }
  }

  var final_conjuctions = [];
  for (var key in conjuctions_hashtable) {
    var conjuctions = conjuctions_hashtable[key];
    for (var i = 0; i < conjuctions.length; i++) {
      var conjuction = conjuctions[i];
      final_conjuctions.push((conjuction[0].join('%')) + '~' + (conjuction[1].join('%')));
    }
  }

  return final_conjuctions.sort().join('|');
}

ccBooleanAnalysis.compareBooleans = function(s1, s2) {
  // First, convert the booleans into parse trees.
  var encoding1 = this.getDNFStringEncoding(s1);
  var encoding2 = this.getDNFStringEncoding(s2);

  return encoding1 == encoding2;
}
