// Feedback loop analysis
// Example of two embedded loops:
// ccBooleanAnalysis.feedbackLoops(['A=D', 'B=A AND E', 'C=B', 'D=C','E=A'])
// Returns:
// [["A", "B", "C", "D", "A"], ["A", "E", "B", "C", "D", "A"]]

ccBooleanAnalysis._findCycles = function(graph, cycles, cur_node, stack, in_progress, visited, global_visited, find_parities) {
  in_progress[cur_node] = true;
  stack.push(cur_node);

  var cur_node_comps = cur_node.split('___');
  var cur_node_name = cur_node_comps[0];
  var cur_node_type = cur_node_comps[1]; // pos or neg

  var neighbors = graph.data[cur_node_name];

  for (var i = 0; i < neighbors.length; i++) {
    var neighbor = neighbors[i];
    var neighbor_comps = neighbor.split('___');
    var neighbor_name = neighbor_comps[0];
    var neighbor_type = neighbor_comps[1]; // pos or neg

    // If there are no incoming nodes to this neighbor, we ignore it.
    if (!(neighbor_name in graph.data)) {
      continue;
    } else if (in_progress[neighbor]) {
      cycle = [neighbor_name];
      var parity = 0;
      for (var j = stack.length - 1; j >= 0; j--) {
        var stack_item_comps = stack[j].split('___');
        var stack_item_name = stack_item_comps[0];
        var stack_item_type = stack_item_comps[1]; // pos or neg

        if (stack_item_type == 'neg') {
          parity += 1;
        }
        cycle.push(stack_item_name);
        if (stack[j] == neighbor) {
          break;
        }
      }
      parity = parity % 2;

      // determine parity
      if (find_parities) {
        cycles.data.push({
          cycle: cycle,
          type: parity
        });
      } else {
        cycles.data.push(cycle);
      }
    } else if (!(visited[neighbor])) {
      var visited_clone = this._clone(visited);
      var in_progress_clone = this._clone(in_progress);
      var stack_clone = stack.slice(0);
      this._findCycles(graph, cycles, neighbor, stack_clone, in_progress_clone, visited_clone, global_visited, find_parities);
    }
  }
  in_progress[cur_node] = false;
  global_visited.data[cur_node_name] = true;
  visited[cur_node] = true;
}

ccBooleanAnalysis._feedbackLoopsCommon = function(equations, find_parities) {
  // Setup base graph form
  var graph = {
    data: {}
  };

  // Generate parse trees for each expression
  for (var i = 0; i < equations.length; i++) {
    // Seperate each side of the equation
    var equation = equations[i];
    var sides = equation.split('=');

    // remove white space
    var lhs = sides[0].split(' ').join('');
    var expression = sides[1];
    var parse_tree = this.getParseTree(expression);

    // Sort the terms
    var terms = {
      data: []
    };

    this._convertToNegationForm(parse_tree);
    this._sortTerms(parse_tree, terms);

    // Here, we disregard whether a term is positive or negative
    // Annotate all terms on the graph
    graph.data[lhs] = [];
    for (var j = 0; j < terms.data.length; j++) {
      var term = terms.data[j];
      graph.data[lhs].push(term);
    }
  }

  // Find all cycles in the graph
  var cycles = {
    data: []
  };

  var global_visited = {
    data: []
  };

  var has_incoming = Object.keys(graph.data);
  for (var i = 0; i < has_incoming.length; i++) {
    var node = has_incoming[i];
    if (!(global_visited.data[node])) {
      this._findCycles(graph, cycles, node, [], {}, {}, global_visited, find_parities);
    }
  }
  return cycles.data;
}

ccBooleanAnalysis.feedbackLoops = function(equations) {
  return this._feedbackLoopsCommon(equations, false);
}

ccBooleanAnalysis.functionalCircuits = function(equations) {
  return this._feedbackLoopsCommon(equations, true);
}
