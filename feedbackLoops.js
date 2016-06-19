// Feedback loop analysis
// Example of two embedded loops:
// ccBooleanAnalysis.feedbackLoops(['A=D', 'B=A AND E', 'C=B', 'D=C','E=A'])
// Returns:
// [["A", "B", "C", "D", "A"], ["A", "E", "B", "C", "D", "A"]]

ccBooleanAnalysis._findCycles = function(graph, cycles, cur_node, stack, in_progress, visited, global_visited) {
  in_progress[cur_node] = true;
  stack.push(cur_node);

  var neighbors = graph.data[cur_node];

  for (var i = 0; i < neighbors.length; i++) {
    var neighbor = neighbors[i];
    // If there are no incoming nodes to this neighbor, we ignore it.
    if (!(neighbor in graph.data)) {
      continue;
    } else if (in_progress[neighbor]) {
      cycle = [neighbor];
      for (var j = stack.length - 1; j >= 0; j--) {
        cycle.push(stack[j]);
        if (stack[j] == neighbor) {
          break;
        }
      }
      cycles.data.push(cycle);
    } else if (!(visited[neighbor])) {
      var visited_clone = this._clone(visited);
      var in_progress_clone = this._clone(in_progress);
      var stack_clone = stack.slice(0);
      this._findCycles(graph, cycles, neighbor, stack_clone, in_progress_clone, visited_clone, global_visited);
    }
  }
  in_progress[cur_node] = false;
  global_visited.data[cur_node] = true;
  visited[cur_node] = true;
}

ccBooleanAnalysis.feedbackLoops = function(equations) {
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
      data: {
        positive: [],
        negative: []
      }
    };

    this._convertToNegationForm(parse_tree);
    this._sortTerms(parse_tree, terms);

    // Here, we disregard whether a term is positive or negative
    // Annotate all terms on the graph
    graph.data[lhs] = [];
    for (var j = 0; j < terms.data.positive.length; j++) {
      var term = terms.data.positive[j];
      graph.data[lhs].push(term);
    }
    for (var j = 0; j < terms.data.negative.length; j++) {
      var term = terms.data.negative[j];
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
      this._findCycles(graph, cycles, node, [], {}, {}, global_visited);
    }
  }
  return cycles.data;
}
