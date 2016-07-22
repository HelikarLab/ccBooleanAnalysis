// Pair-wise distances

// Setup base graph form
ccBooleanAnalysis._getGraph = function(equations, label_pos_neg) {
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
    this._sortTerms(parse_tree, terms, label_pos_neg);

    // Here, we disregard whether a term is positive or negative
    // Annotate all terms on the graph
    for (var j = 0; j < terms.data.length; j++) {
      var term = terms.data[j];
      if (label_pos_neg) {
        var term_comps = term.split('___');
        var term_name = term_comps[0];
        var term_type = term_comps[1]; // pos or neg

        if (!(graph.data[term_name])) {
          graph.data[term_name] = [];
        }
        var resulting_term = lhs + '___' + term_type;
        graph.data[term_name].push(resulting_term);
      } else {
        if (!(graph.data[term])) {
          graph.data[term] = [];
        }
        graph.data[term].push(lhs);
      }
    }

    // graph.data[lhs] = [];
    // for (var j = 0; j < terms.data.length; j++) {
    //   var term = terms.data[j];
    //   graph.data[lhs].push(term);
    // }
  }
  return graph;
}

ccBooleanAnalysis.getDistances = function(equations) {
  // Perform a breadth-first search beginning from each node.
  var distances = {}; // dictionary of dictionaries
  var graph = this._getGraph(equations);

  var has_outgoing = Object.keys(graph.data);
  for (var i = 0; i < has_outgoing.length; i++) {
    var root_node = has_outgoing[i];
    distances[root_node] = {};
    distances[root_node][root_node] = 0;
    var visited = [];
    var dist = 0;
    var queue = new Queue();
    queue.enqueue(root_node);

    while(!(queue.isEmpty())) {
      current = queue.dequeue();
      console.log(current);
      if (!(distances[current])) {
        distances[current] = {};
      }

      var neighbors = graph.data[current];
      for (var j = 0; j < neighbors.length; j++) {
        var neighbor = neighbors[j];
        if (!(neighbor in distances[root_node]) || (distances[root_node][neighbor] > distances[root_node][current] + 1)) {
          distances[root_node][neighbor] = distances[root_node][current] + 1;
          queue.enqueue(neighbor);
        }
        distances[current][neighbor] = 1;
      }
    }
  }
  return distances;
}
