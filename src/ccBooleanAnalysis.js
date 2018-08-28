//    ccBooleanAnalysis 0.1.0
//    ccBooleanAnalysis may be distributed ____
//    http://future.com

/*global module: true, exports: true, console: true */
// (function (root) {
  // 'use strict';
  /* External Modules */
  /*jshint esversion: 6 */

  var jsep = require('jsep');
  var Queue = require('./queue.js');
  var Logic = require('logic-solver');

  /* Module setup */
  const ccBooleanAnalysis = () => {};

  ////////////////////////////////////////
  ////////////////////////////////////////
  ////            Constants
  ////
  ////////////////////////////////////////
  ////////////////////////////////////////

  ccBooleanAnalysis._constants = {
    kNOT: '~',
    kAND: '*',
    kOR: '+',
    kBinaryExpression: "BinaryExpression",
    kUnaryExpression: "UnaryExpression",
    kIdentifier: "Identifier"
  };

  ////////////////////////////////////////
  ////////////////////////////////////////
  ////      Parse Boolean Tree
  ////
  ////////////////////////////////////////
  ////////////////////////////////////////

  ccBooleanAnalysis.getParseTree = s => {
    // unaryOps are broken in Jsep.
    // Instead, we conver to the single unaryOp
    // that currently works.
    // https://github.com/soney/jsep/issues/43
    // let find = '\b(NOT)\b';
    // let re = new RegExp(find, 'g');

    if(s !== "NOT" && s !== 'OR' && s !== 'AND'){
      s = s.replace(/\b(NOT)\b/gi, '~');
      s = s.replace(/\b(AND)\b/gi, '*');
      s = s.replace(/\b(OR)\b/gi, '+');
    }

    s = s.replace(/([A-Z][a-z][0-9])+(\+|\*|~)/, '_');

    // find = '\b(AND)\b';
    // re = new RegExp(find, 'g');

    // find = '(OR)';
    // re = new RegExp(find, 'g');

    return jsep(s);
  };

  const getIdentifiersFromTree = (
    {type, name, argument, left, right}, 
    identifiers = {}
  ) => {
    switch(type){
      case ccBooleanAnalysis._constants.kIdentifier:
        identifiers[name] = name;
        break;
      case ccBooleanAnalysis._constants.kUnaryExpression:
        getIdentifiersFromTree(argument, identifiers);
        break;
      case ccBooleanAnalysis._constants.kBinaryExpression:
        getIdentifiersFromTree(left, identifiers);
        getIdentifiersFromTree(right, identifiers);
        break;
    }
    return identifiers;
  }

  const parseTreeToString = ({type, name, argument, operator, left, right}) => {
    switch(type){
      case ccBooleanAnalysis._constants.kIdentifier:
        return name;
      case ccBooleanAnalysis._constants.kUnaryExpression:
        return operator+"("+parseTreeToString(argument)+")";
      case ccBooleanAnalysis._constants.kBinaryExpression:
        return "(" + 
                parseTreeToString(left) + " " +
                operator + " " +
                parseTreeToString(right) +
                ")";
      default:
        throw new Error("Unreachable");
    }
  }

  ////////////////////////////////////////
  ////////////////////////////////////////
  ////        Boolean Equivalence
  ////
  ////////////////////////////////////////
  ////////////////////////////////////////

  /**
   * @method ccBooleanAnalysis.getDNFObjectEncoding
   * @param {string} s A string representing the boolean expression that should be transformed.
   * @return {object} A hashtable representing the expression in DNF form. Useful for various functions in our library.
   */
   ccBooleanAnalysis.getDNFObjectEncoding = function(s) {
     const iterateAndTree = (positive_holder, negative_holder, parse_tree) => {
       if (parse_tree.type == ccBooleanAnalysis._constants.kIdentifier) {
         positive_holder.data.push(parse_tree.name);
       } else if (parse_tree.type == ccBooleanAnalysis._constants.kUnaryExpression) {
         negative_holder.data.push(parse_tree.argument.name);
       } else {
        iterateAndTree(positive_holder, negative_holder, parse_tree.left);
        iterateAndTree(positive_holder, negative_holder, parse_tree.right);
       }
     };

     const iterateOrTree = (conjuctions, parse_tree) => {
       if (parse_tree.type == ccBooleanAnalysis._constants.kIdentifier) {
         conjuctions.data.push([[parse_tree.name], []]);
       } else if (parse_tree.operator == ccBooleanAnalysis._constants.kAND) {
         const and_positive_holder = {data: []};
         const and_negative_holder = {data: []};
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
     };
     

     // Convert parse tree format to DNF
     const parse_tree = this.getParseTree(s);
/*     console.log("PARSE TREE");
     const formula1 = formulaToStr(parse_tree);
     console.log(formulaToStr(parse_tree));
*/
     this._convertToNegationForm(parse_tree);

     this._pushDownAnds(parse_tree);
/*
     console.log("CONVERT TO NEGATION 2");
     const formula2 = formulaToStr(parse_tree);
     console.log(formulaToStr(parse_tree));
     console.log(formulaToReadable(parse_tree).join('\n'));
     console.log("EQUALS "+this.compareBooleansSAT(formula1, formula2));
*/
     // Main Logic
     let conjuctions = {data: []};
     iterateOrTree(conjuctions, parse_tree);
/*
     console.log("CONJUNCTIONS");
     console.log(JSON.stringify(conjuctions, null, 2));
*/
     for (var i = 0; i < conjuctions.data.length; i++) {
       let conjuction_a = conjuctions.data[i];

       // If a conjuction is a subpart of another one (considering negations),
       // then discard the larger one.
       for (let j = i + 1; j < conjuctions.data.length; j++) {
         let conjuction_b = conjuctions.data[j];
         const subset = [ccBooleanAnalysis._is_subset(conjuction_a[0], conjuction_b[0]), ccBooleanAnalysis._is_subset(conjuction_a[1], conjuction_b[1])];
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

     const conjuctions_hashtable = {};
     for (let i = 0; i < conjuctions.data.length; i++) {
       const conjuction = conjuctions.data[i];
       const key = this._get_union(conjuction[0], conjuction[1]).join('');

       let no_collision = true;
       if (key in conjuctions_hashtable) {
         const collisions = conjuctions_hashtable[key];
         for (let j = 0; j < collisions.length; j++) {
           const collision = collisions[j];

           // heuristic to avoid taking intersection in every case
           const collision_has_neg = ((collision[0].length == conjuction[0].length - 1) && (collision[1].length == conjuction[1].length + 1));
           const conjuction_has_neg = ((collision[0].length == conjuction[0].length + 1) && (collision[1].length == conjuction[1].length - 1));
           let conjuction_a, conjuction_b;
           if (collision_has_neg || conjuction_has_neg) {
             if (collision_has_neg) {
               conjuction_a = conjuction.slice();
               conjuction_b = collision.slice();
             } else {
               conjuction_a = collision.slice();
               conjuction_b = conjuction.slice();
             }

             // get and remove this intersection
             const intersection = [this._remove_intersection(conjuction_a[0], conjuction_b[0]), this._remove_intersection(conjuction_a[1],   conjuction_b[1])];

             // confirm that the only difference is a term switched from pos to neg
             if (conjuction_a[0].length == 1 && conjuction_a[1].length === 0 && conjuction_b[1].length == 1 && conjuction_b[0].length === 0 &&   conjuction_a[0][0] ==  conjuction_b[1][0]) {
               no_collision = false; // mark that we've had a collision

               // remove the collision
               conjuctions_hashtable[key].splice(j, 1);
               j--;

               const new_key = this._get_union(intersection[0], intersection[1]).join('');
               if (new_key in conjuctions_hashtable) {
                 conjuctions_hashtable[new_key].push(intersection);
               } else {
                 conjuctions_hashtable[new_key] = [intersection];
               }
             }
           }
         }
       }
       if (no_collision) {
         if (!(key in conjuctions_hashtable)) {
           conjuctions_hashtable[key] = [conjuction];
         } else {
           conjuctions_hashtable[key].push(conjuction);
         }

       }
     }

     return conjuctions_hashtable;
   };

  /**
   * @method dnfToJsep
   * @param {object} conjuctions_hashtable result of 
   * @return {object} jsep representation of data
   */
   const dnfToJsep = function(conjuctions_hashtable) {
     const cons = ccBooleanAnalysis._constants;
     
     let mkId = e => ({
         type: cons.kIdentifier,
         name: e
     });
     let mkNnary = (e,op) => {
        let i = e.length;
        if(i <= 1) return e[0];

        let ret;
        //iterative solution to make left associative parse tree
        const mkBinary = (l, r) => (l ? {type: cons.kBinaryExpression, operator: op, left: l, right: r} : r);
        e.forEach(e=>{ret = mkBinary(ret, e);});
        return ret;
     };
     let mkUnary = e => ({
         type: cons.kUnaryExpression,
         argument: e,
         operator: cons.kNOT
     });

     let final_conjuctions = [];
     for (const key in conjuctions_hashtable) {
       conjuctions_hashtable[key].forEach(conjuction => {
         let items = conjuction[0].map(mkId).concat(conjuction[1].map(e => mkUnary(mkId(e))));
         if(items.length) final_conjuctions.push(mkNnary(items, cons.kAND));
       });
     }

     return mkNnary(final_conjuctions, cons.kOR);
   };

  /**
   * @method ccBooleanAnalysis.getDNFStringEncoding
   * @param {string} s A string representing the boolean expression that should be transformed.
   * @return {string} A string encoding of the boolean expression in DNF.
   */
   ccBooleanAnalysis.getDNFStringEncoding = function(s) {
     const conjuctions_hashtable = this.getDNFObjectEncoding(s);

     const final_conjuctions = [];
     for (const key of conjuctions_hashtable) {
       const conjuctions = conjuctions_hashtable[key];

       for (const conjuction of conjuctions) {
         final_conjuctions.push(`${conjuction[0].join('%')}~${conjuction[1].join('%')}`);
       }
     }

     return final_conjuctions.sort().join('|');
   };

   /**
    * @method ccBooleanAnalysis.compareBooleans
    * @param {string} s1 The first boolean expression to be compared.
    * @param {string} s2 The second boolean expression to be compared.
    * @return {string} A string encoding of the boolean expression in DNF.
    */
   ccBooleanAnalysis.compareBooleans = function(s1, s2) {
     const encoding1 = this.getDNFStringEncoding(s1);
     const encoding2 = this.getDNFStringEncoding(s2);

     return encoding1 == encoding2;
   };

   ////////////////////////////////////////
   ////////////////////////////////////////
   ////        Graph Manipulation
   ////
   ////////////////////////////////////////
   ////////////////////////////////////////

   /**
    * @method ccBooleanAnalysis._getGraph
    * @param {array[string]} equations Array of strings with boolean equations.
    * @param {boolean} label_pos_neg True if graph terms contain pos/neg indicators. False otherwise.
    * @return {obj} Javascript object representing the graph.
    */
   ccBooleanAnalysis._getGraph = function(equations, label_pos_neg) {
     const graph = {
       data: {}
     };

     // Generate parse trees for each expression
     // Seperate each side of the equation
     for (const equation of equations) {
       const sides = equation.split('=');

       // remove white space
       const lhs = sides[0].split(' ').join('');
       const expression = sides[1];
       const parse_tree = this.getParseTree(expression);

       // Sort the terms
       const terms = {
         data: []
       };

       this._convertToNegationForm(parse_tree);
       this._sortTerms(parse_tree, terms, label_pos_neg);

       // Here, we disregard whether a term is positive or negative
       // Annotate all terms on the graph
       for (const term of terms.data) {
         if (label_pos_neg) {
           const term_comps = term.split('___');
           const term_name = term_comps[0];
           const term_type = term_comps[1]; // pos or neg

           if (!(graph.data[term_name])) {
             graph.data[term_name] = [];
           }
           const resulting_term = `${lhs}___${term_type}`;
           graph.data[term_name].push(resulting_term);
         } else {
           if (!(graph.data[term])) {
             graph.data[term] = [];
           }
           graph.data[term].push(lhs);
         }
       }
     }

     return graph;
   };


  ////////////////////////////////////////
  ////////////////////////////////////////
  ////        Feedback Loops
  ////
  ////////////////////////////////////////
  ////////////////////////////////////////

  // Common method to find cycles.
  // Used for feedback loops and functional circuits.
  // Example of two embedded loops:
  // feedbackLoops(['A=D', 'B=A AND E', 'C=B', 'D=C','E=A'])
  // Returns:
  // [["A", "B", "C", "D", "A"], ["A", "E", "B", "C", "D", "A"]]
  const _findCycles = (
    graph,
    cycles,
    cur_node,
    stack,
    in_progress,
    visited,
    global_visited,
    find_parities) => {
    in_progress[cur_node] = true;
    stack.push(cur_node);

    const cur_node_comps = cur_node.split('___');
    const cur_node_name = cur_node_comps[0];
    const cur_node_type = cur_node_comps[1]; // pos or neg

    const neighbors = graph.data[cur_node_name];

    for (const neighbor of neighbors) {
      const neighbor_comps = neighbor.split('___');
      const neighbor_name = neighbor_comps[0];
      const neighbor_type = neighbor_comps[1]; // pos or neg

      // If there are no incoming nodes to this neighbor, we ignore it.
      if (!(neighbor_name in graph.data)) {
        continue;
      } else if (in_progress[neighbor]) {
        let cycle = [neighbor_name];
        let parity = 0;
        for (let j = stack.length - 1; j >= 0; j--) {
          const stack_item_comps = stack[j].split('___');
          const stack_item_name = stack_item_comps[0];
          const stack_item_type = stack_item_comps[1]; // pos or neg

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
            cycle: cycle.reverse(),
            type: parity
          });
        } else {
          cycles.data.push(cycle.reverse());
        }
      } else if (!(visited[neighbor])) {
        const visited_clone = ccBooleanAnalysis._clone(visited);
        const in_progress_clone = ccBooleanAnalysis._clone(in_progress);
        const stack_clone = stack.slice(0);
        _findCycles(graph, cycles, neighbor, stack_clone, in_progress_clone, visited_clone, global_visited, find_parities);
      }
    }

    in_progress[cur_node] = false;
    global_visited.data[cur_node_name] = true;
    visited[cur_node] = true;
  };

  // Essentially a wrapper for _findCycles.
  // Creates graph from equations and prepares data structures.
  var _feedbackLoopsCommon = function(equations, find_parities) {
    var graph = ccBooleanAnalysis._getGraph(equations, find_parities);

    // Find all cycles in the graph
    var cycles = {
      data: []
    };

    var global_visited = {
      data: {}
    };

    var has_incoming = Object.keys(graph.data);
    for (var i = 0; i < has_incoming.length; i++) {
      var node = has_incoming[i];
      if (!(global_visited.data[node])) {
        _findCycles(graph, cycles, node, [], {}, {}, global_visited, find_parities);
      }
    }
    return cycles.data;
  };

  /**
   * @method ccBooleanAnalysis.feedbackLoops
   * @param {array[string]} equations Array of strings with boolean equations.
   * @return {array[string]} Array containing the feedback loops.
   */
   ccBooleanAnalysis.feedbackLoops = equations => _feedbackLoopsCommon(equations, false);

  /**
   * @method ccBooleanAnalysis.functionalCircuits
   * @param {array[string]} equations Array of strings with boolean equations.
   * @return {array[string]} Array containing the functional circuits.
   */
   ccBooleanAnalysis.functionalCircuits = equations => _feedbackLoopsCommon(equations, true);
   ccBooleanAnalysis.functionalCircuits = equations => _feedbackLoopsCommon(equations, true);

  ////////////////////////////////////////
  ////////////////////////////////////////
  ////        Distances
  ////
  ////////////////////////////////////////
  ////////////////////////////////////////

  /**
   * @method ccBooleanAnalysis.distances
   * @param {array[string]} equations Array of strings with boolean equations.
   * @return {obj} Javascript object where obj[a][b] represents dist(a,b).
   */
   ccBooleanAnalysis.distances = function(equations) {
     // Perform a breadth-first search beginning from each node.
     const distances = {}; // dictionary of dictionaries
     const graph = this._getGraph(equations);

     const has_outgoing = Object.keys(graph.data);
     let neighbor;

     for (const root_node of has_outgoing) {
       const visited = [];
       const dist = 0;
       const queue = new Queue();

       distances[root_node] = {};
       let neighbors = graph.data[root_node];
       for (var j = 0; j < neighbors.length; j++) {
         neighbor = neighbors[j];
         distances[root_node][neighbor] = 1;
         queue.enqueue(neighbor);
       }

       while(!(queue.isEmpty())) {
         let current = queue.dequeue();
         if (!(distances[current])) {
           distances[current] = {};
         }

         if (current in graph.data) {
           neighbors = graph.data[current];
           for (let j = 0; j < neighbors.length; j++) {
             neighbor = neighbors[j];
             if (!(neighbor in distances[root_node]) || (distances[root_node][neighbor] > distances[root_node][current] + 1)) {
               distances[root_node][neighbor] = distances[root_node][current] + 1;
               queue.enqueue(neighbor);
             }
             distances[current][neighbor] = 1;
           }
         }
       }
     }
     return distances;
   };

  /**
   * @method ccBooleanAnalysis.averageDistance
   * @param {array[string]} equations Array of strings with boolean equations.
   * @return {float} The average distance between nodes.
   */
   ccBooleanAnalysis.averageDistance = function(equations) {
     const distances = this.distances(equations);
     const nodes = Object.keys(distances);

     let total_distance = 0;
     let node_count = 0;
     for (let i = 0; i < nodes.length; i++) {
       const node1 = nodes[i];
       for (let j = i + 1; j < nodes.length; j++) {
         const node2 = nodes[j];
         if(distances[node1][node2]){
           total_distance += distances[node1][node2];
           node_count += 1;
         }
       }
     }
     return total_distance / node_count;
   };

   /**
    * @method ccBooleanAnalysis.connectivity
    * @param {array[string]} equations Array of strings with boolean equations.
    * @return {obj} Javascript object where obj[a][b] is true if a and b are connected. False otherwise.
    */
   ccBooleanAnalysis.connectivity = function(equations) {
     const distances = this.distances(equations);
     const nodes = Object.keys(distances);

     const connectivity = {};

     for (const node1 of nodes) {
       connectivity[node1] = {};

       for (const node2 of nodes) {
         // is node1 connected to node2? (1 -> 2)
         const connected = (node2 in distances[node1] && connectivity[node1][node2] === 1);
         connectivity[node1][node2] = connected;
       }
     }

     return connectivity;
   };

   /**
    * @method ccBooleanAnalysis.connectivityInDegree
    * @param {array[string]} equations Array of strings with boolean equations.
    * @return {obj} Javascript object where obj[a] is the in-degree of node a.
    */
   ccBooleanAnalysis.connectivityInDegree = function(equations) {
     let connectivity = {};
     let graph = this._getGraph(equations).data;
     let nodes = Object.keys(this.distances(equations));
     nodes.forEach(e => (connectivity[e] = 0));

     for(let node in graph){
         let outNodes = Array.from(new Set(graph[node]));

         if(outNodes.length){
           outNodes.forEach(e => {
             (e in connectivity) ? connectivity[e]++ : connectivity[e] = 0
           });
         }
     }
     return connectivity;
   };

   /**
    * @method ccBooleanAnalysis.connectivityOutDegree
    * @param {array[string]} equations Array of strings with boolean equations.
    * @return {obj} Javascript object where obj[a] is the out-degree of node a.
    */
   ccBooleanAnalysis.connectivityOutDegree = function(equations) {
     let connectivity = {};

     let graph = this._getGraph(equations).data;
     let nodes = Object.keys(this.distances(equations));
     nodes.forEach(e => (connectivity[e] = 0));

     for(let k in graph){
          connectivity[k] = new Set(graph[k]).size;
      }

     return connectivity;
   };

   /**
    * @method ccBooleanAnalysis.connectivityDegree
    * @param {array[string]} equations Array of strings with boolean equations.
    * @return {obj} Javascript object where obj[a] is the degree (in-degree + out-degree) of node a.
    */
   ccBooleanAnalysis.connectivityDegree = function(equations) {

     let connectivity = {};
     let inDegree = this.connectivityInDegree(equations);
     let outDegree = this.connectivityOutDegree(equations);

     for(let n in inDegree){
        if(n in inDegree && n in outDegree)
          connectivity[n] = inDegree[n] + outDegree[n];
        else
          connectivity[n] = 0;
     }

     return connectivity;
   };

   /**
    * @method ccBooleanAnalysis.connectivityDistributionGraph
    * @param {array[string]} equations Array of strings with boolean equations.
    * @return {obj} Javascript object with keys inDegree, outDegree, and degree, following same format
    * as those respective functions in ccBooleanAnalysis library.
    */
   ccBooleanAnalysis.connectivityDistributionGraph = equations => ({
     'inDegree': ccBooleanAnalysis.connectivityInDegree(equations),
     'outDegree': ccBooleanAnalysis.connectivityOutDegree(equations),
     'degree': ccBooleanAnalysis.connectivityDegree(equations)
   });

   /**
    * @method ccBooleanAnalysis.averageDistance
    * @param {array[string]} equations Array of strings with boolean equations.
    * @return {obj} Javascript object where obj[node] = average connectivity of the node.
    */
   ccBooleanAnalysis.averageConnectivity = function(equations) {
     const connectivity = this.connectivity(equations);

     const averageConnectivity = {};
     for (const source in connectivity) {
       let connected_targets = 0;
       let total_targets = 0;
       for (const target in connectivity[source]) {
         total_targets += 1;
         if (connectivity[source][target]) {
           connected_targets += 1;
         }
       }
       averageConnectivity[source] = connected_targets / total_targets;
     }
     return averageConnectivity;
   };

   /**
    * @method ccBooleanAnalysis.diameter
    * @param {array[string]} equations Array of strings with boolean equations.
    * @return {obj} Javascript object where obj[a][b] is True if a and b are connected. False otherwise.
    */
   ccBooleanAnalysis.diameter = function(equations) {
     const distances = this.distances(equations);
     let diameter = 0;
     for (let source in distances) {
       for (let target in distances[source]) {
         const distance = distances[source][target];
         if (distance > diameter) {
           diameter = distance;
         }
       }
     }
     return diameter;
   };

  ////////////////////////////////////////
  ////////////////////////////////////////
  ////     Biological Regulators
  ////
  ////////////////////////////////////////
  ////////////////////////////////////////

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

   * Each regulator is structured as follows:
   *     "component" - name of the given component (name of the variable in parsed expression)
   *     "type" - false (negative regulator), true (positive regulator) (not mandatory - false is default)
   *     "conditionRelation" - false (or = independent), true (and = cooperative) (not mandatory - false is default)
   *     "conditions" - array of condition objects (described bellow) is not mandatory if given regulator does not have any conditions
   *     "dominants" - array of regulators that are dominant over this regulator, not mandatory
   *     "recessives" - array of regulators that this regulator is dominant over, not mandatory
   *
   *     condition object contains following properties:
   *     "componentRelation" - false (or = independent), true (and = cooperative), not mandatory - false is default
   *     "subConditionRelation" - false (or = independent), true (and = cooperative), not mandatory - false is default
   *     "state" - false (inactive), true (active), not mandatory - false is default
   *     "type" - false (unless), true (if when), not mandatory - false is default
   *     "components" - array of component names (variables in parsed expression), this should contain at least one component
   *     "conditions" - array of subcondition objects (described bellow), not mandatory
   *
   *     subcondition object contains following properties:
   *     "componentRelation" - false (or = independent), true (and = cooperative), not mandatory - false is default
   *     "state" - false (inactive), true (active), not mandatory - false is default
   *     "type" - false (unless), true (if when), not mandatory - false is default
   *     "components" - array of component names (variables in parsed expression), this should contain at least one component

   
   */
   let getRegulators = parse_tree => {
    const objEach = (o, f) => {
        for(var k in o) f(o[k],k);
    }
    const objMap = (o, f) => {
        let ret = {};
        for(var k in o) ret[k] = f(o[k],k);
        return ret;
    }
       
       
    let positive_regulators = {}, negative_regulators = {};
    const addNegRegulator = (name) => (
        negative_regulators[name] = negative_regulators[name] || {
            component: name,
            type: false
        }
    );
    const addPosRegulator = (name) => (
        positive_regulators[name] = positive_regulators[name] || {
            component: name,
            type: true,
            conditionRelation: false,
            conditions: []
        }
    );



    // Tree traversal methods
    const iterateAndTree = (positive_holder, negative_holder, parse_tree) => {
      if (parse_tree.type == ccBooleanAnalysis._constants.kIdentifier) {
        positive_holder.data.push(parse_tree.name);
      } else if (parse_tree.type == ccBooleanAnalysis._constants.kUnaryExpression) {
        negative_holder.data.push(parse_tree.argument.name);
      } else {
       iterateAndTree(positive_holder, negative_holder, parse_tree.left);
       iterateAndTree(positive_holder, negative_holder, parse_tree.right);
      }
    };

    const addLiteral = (positives, negatives) => {
      if(positives.length > 0){
          let regulator = addPosRegulator(positives[0]);
          regulator.isAlone = (positives.length <= 1 && negatives.length <= 0) || regulator.isAlone;

          let cond = {
              state: true, // active
              type: true, // if/whencomponents.filter((_,idx)=>idx)]
              componentRelation: true, //cooperative
              components: positives.slice(1),
          };
          if(negatives.length){
              cond.subConditionRelation = false;
              cond.conditions = [{
                  componentRelation: true, //cooperative
                  state: false,    //inactive
                  type: true, // if/whencomponents.filter((_,idx)=>idx)]
                  components: negatives
              }];
          }
          regulator.conditions.push(cond);
      }else if(negatives.length > 0){
          let reg = negatives.forEach(addNegRegulator);
            reg.isAlone = negatives.length <= 1;
      }
    }

    const iterateOrTree = (parse_tree) => {
      if (parse_tree.operator == ccBooleanAnalysis._constants.kAND) {
        let and_positive_holder = {data: []};
        let and_negative_holder = {data: []};
        iterateAndTree(and_positive_holder, and_negative_holder, parse_tree);

        let positives = and_positive_holder.data;
        let negatives = and_negative_holder.data;

        addLiteral(positives, negatives);
      } else if (parse_tree.type == ccBooleanAnalysis._constants.kIdentifier) {
        // Add a positive regulator with no conditions
        addLiteral([parse_tree.name], []);
      } else if (parse_tree.type == ccBooleanAnalysis._constants.kUnaryExpression) {
        // Add a negative regulator with no conditions
        addLiteral([], [parse_tree.argument.name]);
      } else { // kOR
        iterateOrTree(parse_tree.left);
        iterateOrTree(parse_tree.right);
      }
    };

    // Main Logic - extract naive representation ( DNF as set of conditions and subconditions )
    iterateOrTree(parse_tree);

    //we can extract negative regulators just from the components which have some additional positives
    const regulatorCanExtractNegatives = (regulator) => {
      return regulator.conditions && 
          regulator.conditions.length > 0 && 
          regulator.conditions.find(e => e.components.length <= 0) === undefined;
    }

    //extract negative regulators
    let canNegatives = objMap(positive_regulators, regulator => {
        let negatives = [];
        if(!regulatorCanExtractNegatives(regulator))
            return [];

        regulator.conditions.forEach(condition => {
            if(condition.conditions && regulator.conditions.length){
                condition.conditions.forEach(subCondition => {
                    negatives.push([].concat(subCondition.components).sort());
                });
            }else{
                negatives.push([]);
            }
        });

        let inters = negatives[0];
        for(let i = 1; i < negatives.length; ++i)
            inters = ccBooleanAnalysis._get_intersection(inters, negatives[i]);
        return inters;
    });

    //find negative regulators ( basically by groupping of subconditions )
    while(true){
//    while(true){
        let occurences = {};
        //count occurences negative components inside positives
        objEach(canNegatives, a => a.forEach(v=>{
            if(negative_regulators[v]) return;
            if(!occurences[v]) occurences[v] = 0;
            occurences[v]++;
        }));
        //find negative component with maximal occurence inside positives
        let maxidx = undefined;
        objEach(occurences, (v,k) => {if(!negative_regulators[k] && !positive_regulators[k] && occurences[k] > (occurences[maxidx] || -Infinity)){maxidx = k}});
        if(maxidx){
            let dominants = [];
            objEach(positive_regulators, (regulator,name) => {
                if(!regulator.conditions || 
                        (regulator.conditions || []).length <= 0 ||
                        canNegatives[name].indexOf(maxidx) < 0)
                    return;

                regulator.conditions.forEach(condition => {
                    if(condition.conditions){
                        condition.conditions.forEach(subCondition => {
                            let pos = subCondition.components.indexOf(maxidx);
                            if(pos >= 0){
                                subCondition.components.splice(pos,1);
                            }
                        });
                    }
                });
                dominants.push({component: regulator.component});
            });
            if(dominants.length)
                addNegRegulator(maxidx).dominants = dominants;

            //extract maxidx from the negative regulators
            objEach(canNegatives, v=>{ if(v.indexOf(maxidx) >= 0) v.splice(v.indexOf(maxidx),1); });
        }else{
            break;
        }
    }


    //remove subConditions without any components
    objEach(positive_regulators, regulator => {
        regulator.conditions.forEach(condition => {
            if(condition.conditions){
                condition.conditions = condition.conditions.filter(e=>e.components.length);
            }
        });
    });




    //transform regulators which have condition without components but this condition have subconditions with components to conditions
    objEach(positive_regulators, regulator => {
        regulator.conditions.forEach(condition => {
            if(condition.components.length <= 0 && condition.conditions){
                //has just negative regulators >> transform subcondition into condition
                condition.conditions.forEach(subCondition => {
                    regulator.conditions.push({
                        componentRelation: true, //cooperative
                        type: true, // if/whencomponents.filter((_,idx)=>idx)]
                        state: false, //inactive
                        components: subCondition.components
                    });
                });
            }
        });
    });
    objEach(positive_regulators, regulator => {
        regulator.conditions = regulator.conditions.filter(condition => condition.components.length);
    });

    //some regulators have isAlone, and when they have it and they have
    let singles = [];
    const extractSingles = regulator => {
      if(regulator.isAlone){
        delete regulator.isAlone;
        if(regulator.conditions && regulator.conditions.length > 0){
          singles.push({
            component: regulator.component,
            type: regulator.type,
          });
        }
      }
    };

    objEach(positive_regulators, extractSingles);
    objEach(negative_regulators, extractSingles);

    return ccBooleanAnalysis._getValues(positive_regulators).concat(ccBooleanAnalysis._getValues(negative_regulators)).concat(singles);
  };

  const formulaToStr = (f) => {
     let cons = ccBooleanAnalysis._constants;
     switch(f.type){
         case cons.kBinaryExpression:
            return '('+formulaToStr(f.left)+f.operator+formulaToStr(f.right)+')';
         case cons.kUnaryExpression:
            return '('+f.operator+'('+formulaToStr(f.argument)+'))';
         case cons.kIdentifier:
            return f.name;
         default:
            throw new Error("Unexpected node (type >>"+f.type+"<<) in parse tree");
     }
  }

  const formulaToReadable = (f) => {
    let addPadding = (e) => e.map(e=>' '+e);
    let cons = ccBooleanAnalysis._constants;
    switch(f.type){
        case cons.kBinaryExpression:
           return addPadding(formulaToReadable(f.left)).concat([
              f.operator,
              ]).concat(addPadding(formulaToReadable(f.right)));
        case cons.kUnaryExpression:
           return [
             f.operator].concat(
             addPadding(formulaToReadable(f.argument))
           );
        case cons.kIdentifier:
           return [f.name];
        default:
           throw new Error("Unexpected node (type >>"+f.type+"<<) in parse tree");
    }
 }


   // Recursively finds all terms in a parse_tree
   // and store them in a terms data structure,
   // which should be structured as
   // {'data': []}.
   const _getTerms = (parse_tree, terms) => {
     let cons = ccBooleanAnalysis._constants;
     switch(parse_tree.type){
         case cons.kBinaryExpression:
            _getTerms(parse_tree.left, terms);
            _getTerms(parse_tree.right, terms);
            break;
         case cons.kUnaryExpression:
            _getTerms(parse_tree.argument, terms);
            break;
         case cons.kIdentifier:
            terms[parse_tree.name] = true;
            break;
     }
   };

  /**
   * @method ccBooleanAnalysis.getBiologicalConstructs
   * @param {jsep} s A string (from a human) of the boolean expression.
   * @return {obj} Javascript object representing the regulators. They are formatted as such:
   *  {
   *     regulators: [...],
   *     absentState: true
   *  }
   *
   * Each regulator is structured as follows:
   *     "component" - name of the given component (name of the variable in parsed expression)
   *     "type" - false (negative regulator), true (positive regulator) (not mandatory - false is default)
   *     "conditionRelation" - false (or = independent), true (and = cooperative) (not mandatory - false is default)
   *     "conditions" - array of condition objects (described bellow) is not mandatory if given regulator does not have any conditions
   *     "dominants" - array of regulators that are dominant over this regulator, not mandatory
   *     "recessives" - array of regulators that this regulator is dominant over, not mandatory
   *
   *     condition object contains following properties:
   *     "componentRelation" - false (or = independent), true (and = cooperative), not mandatory - false is default
   *     "subConditionRelation" - false (or = independent), true (and = cooperative), not mandatory - false is default
   *     "state" - false (inactive), true (active), not mandatory - false is default
   *     "type" - false (unless), true (if when), not mandatory - false is default
   *     "components" - array of component names (variables in parsed expression), this should contain at least one component
   *     "conditions" - array of subcondition objects (described bellow), not mandatory
   *
   *     subcondition object contains following properties:
   *     "componentRelation" - false (or = independent), true (and = cooperative), not mandatory - false is default
   *     "state" - false (inactive), true (active), not mandatory - false is default
   *     "type" - false (unless), true (if when), not mandatory - false is default
   *     "components" - array of component names (variables in parsed expression), this should contain at least one component
   */
   ccBooleanAnalysis.getBiologicalConstructs = function(s) {
    let getKeys = (r,e) => {
        if(Array.isArray(e)){ e.forEach((_,k)=>getKeys(r,e[k])); }
        else if(e instanceof Object){ for(let k in e) getKeys(r,e[k]); }
        else{ r[e]=false };
        return r;
    };

    let dnf = this.getDNFObjectEncoding(s);
    let olddnf = dnf;

    console.log("DNF")
    console.log(JSON.stringify(dnf, null, 1 ));
    console.log(JSON.stringify(formulaToStr(dnfToJsep(dnf)), null, 1 ));

    let keys = getIdentifiersFromTree(this.getParseTree(s));
    let regexes = this._getRegexes(keys);
    let absentState = false;

    let hasPositive = false;
    for(let k in dnf){
        dnf[k].forEach(v => {hasPositive = hasPositive || v[0].length > 0;});
    }

    let tree;
    //check for absent state
    if(this._evaluateState(s, regexes.map(e=>[e[0], false]))){
      let newdnf = this.getDNFObjectEncoding('('+s+')*('+Object.keys(keys).join('+')+')')
      absentState = true;
      dnf = newdnf;
    }


    let newkeys = getKeys({},dnf);
    let missing = Object.keys(keys).filter(k=>newkeys[k] === undefined);
    if(missing.length > 0){
        //extracting absent state does not remove any component from equation >> have to fill it with the missing values
        let newdnfarr = ccBooleanAnalysis._getValues(dnf);
        let elsize = e=>e[0].length+e[1].length;
        let len = (e) => e.map(elsize);
        newdnfarr.sort((v1,v2) => Math.max.apply(null,len(v2)) - Math.max.apply(null,len(v1)));
        if(newdnfarr.length){
            newdnfarr[0].sort((v1,v2) => elsize(v2)-elsize(v1));
            let orig = newdnfarr[0].shift();

            if(newdnfarr.length <= 0){
                let k = orig[0].concat(orig[1]).sort().join("");
                delete dnf[k];
            }

            let k = orig[0].concat(orig[1]).concat(missing).sort().join("");
            if(!dnf[k]){ dnf[k] = []; }

            //loop through state space of all missing elements
            for (let i = 0; i < (1 << missing.length); i++) {
                let newd = [orig[0].map(e=>e),orig[1].map(e=>e)];
                for(let j = 0; j < missing.length; j++){
                    newd[(i >> j) & 1].push(missing[j]);
                }
                dnf[k].push(newd);
            }
        }
    }

    tree = dnfToJsep(dnf);
    this._convertToNegationForm(tree);
    this._pushDownAnds(tree);

    console.log(JSON.stringify({
      regulators: getRegulators(tree),
      absentState
    },null,2));

    return {
       regulators: getRegulators(tree),
       absentState
     };
   };

   ////////////////////////////////////////
   ////////////////////////////////////////
   ////     Misc Helpers
   ////
   ////////////////////////////////////////
   ////////////////////////////////////////

   // Clone a javascript object / dictionary
   ccBooleanAnalysis._clone = item => {
     if (!item) { return item; } // null, undefined values check

     const types = [ Number, String, Boolean ];
     let result;

     // normalizing primitives if someone did new String('aaa'), or new Number('444');
     types.forEach(type => {
         if (item instanceof type) {
             result = type( item );
         }
     });

     if (typeof result == "undefined") {
         if (Object.prototype.toString.call( item ) === "[object Array]") {
             result = [];
             item.forEach((child, index, array) => {
                 result[index] = ccBooleanAnalysis._clone( child );
             });
         } else if (typeof item == "object") {
             // testing that this is DOM
             if (item.nodeType && typeof item.cloneNode == "function") {
                 result = item.cloneNode( true );
             } else if (!item.prototype) { // check that this is a literal
                 if (item instanceof Date) {
                     result = new Date(item);
                 } else {
                     // it is an object literal
                     result = {};
                     for (const i in item) {
                         result[i] = ccBooleanAnalysis._clone( item[i] );
                     }
                 }
             } else {
                 // depending what you would like here,
                 // just keep the reference, or create new object
                 if (false && item.constructor) {
                     // would not advice to do that, reason? Read below
                     result = new item.constructor();
                 } else {
                     result = item;
                 }
             }
         } else {
             result = item;
         }
     }

     return result;
   };

   // Get all values in a dictionary
   ccBooleanAnalysis._getValues = dict => {
     const array_values = [];
     for (const key in dict) {
       array_values.push(dict[key]);
     }
     return array_values;
   };

   // Get all values from a dictionary and flatten them
   // Ex. {
   //  'AB': [  [1], [2], [3]  ]
   //  'C':  [  [4], [5] ]
   // }
   //
   // Produces:
   // [ [1], [2], [3], [4], [5] ]
   //
   // If _getValues was used, it would instead produce:
   // [ [ [1],[2],[3] ], [ [4], [5] ] ]
   //
   //
   ccBooleanAnalysis._getValuesFlattened = dict => {
     const array_values = [];
     for (const key in dict) {
       const value_arr = dict[key];
       for (let i = 0; i < value_arr.length; i++) {
         array_values.push(value_arr[i]);
       }
     }
     return array_values;
   };

   // Get all keys in a dictionary
   ccBooleanAnalysis._getKeys = dict => {
     const array_keys = [];
     for (const key in dict) {
       array_keys.push(key);
     }
     return array_keys;
   };

   // Return unique vlaues
   // use as follows:
   // data.filter(ccBooleanAnalysis._uniqueFilter)
   ccBooleanAnalysis._uniqueFilter = (value, index, self) => self.indexOf(value) == index;

   // Boolean
   // do two arrays share a common term?
   ccBooleanAnalysis._shares_term = (a, b) => {
     let ai=0;
     let bi=0;
     const result = [];

     while(ai < a.length && bi < b.length)
     {
        if      (a[ai] < b[bi]){ ai++; }
        else if (a[ai] > b[bi]){ bi++; }
        else /* they're equal */
        {
         return true;
        }
     }

     return false;
   };

   // Removes shared variables from two arrays and returns them
   // in a new array.
   // Input must be sorted.
   // Output is sorted.
   ccBooleanAnalysis._remove_intersection = (a, b) => {
     let ai=0;
     let bi=0;
     const result = [];

     while(ai < a.length && bi < b.length)
     {
        if      (a[ai] < b[bi]){ ai++; }
        else if (a[ai] > b[bi]){ bi++; }
        else /* they're equal */
        {
          result.push(a[ai]);
          a.splice(ai, 1);
          b.splice(bi, 1);
        }
     }

     return result;
   };

   // Returns the union of two arrays
   // Input must be sorted.
   // Output is sorted.
   ccBooleanAnalysis._get_union = (a, b) => {
     let ai=0;
     let bi=0;
     const result = [];

     while(ai < a.length && bi < b.length)
     {
        if      (a[ai] < b[bi]){ result.push(a[ai]); ai++; }
        else if (a[ai] > b[bi]){ result.push(b[bi]); bi++; }
        else /* they're equal */
        {
          result.push(a[ai]);
          ai++;
          bi++;
        }
     }

     while (ai < a.length)
     {
       result.push(a[ai]);
       ai++;
     }

     while (bi < b.length)
     {
       result.push(b[bi]);
       bi++;
     }

     return result;
   };

   // Find the intersection of two arrays without modifying
   // those arrays.
   // Input must be sorted.
   // Output is sorted.
   ccBooleanAnalysis._get_intersection = (a, b) => {
     let ai=0;
     let bi=0;
     const result = [];

     while(ai < a.length && bi < b.length)
     {
        if      (a[ai] < b[bi]){ ai++; }
        else if (a[ai] > b[bi]){ bi++; }
        else /* they're equal */
        {
          result.push(a[ai]);
          ai++;
          bi++;
        }
     }

     return result;
   };

   // Is a a subset of b?
   // Is b a subset of a?
   //
   // returns:
   // 0 - no subsets
   // 1 - a is subset of b (a < b)
   // 2 - b is subset of a (b < a)
   ccBooleanAnalysis._is_subset = function(a, b) {
     const intersection_len = this._get_intersection(a, b).length;
     if (a.length === intersection_len) {
       return 1;
     } else if (b.length === intersection_len) {
       return 2;
     }
     return 0;
   };

   ////////////////////////////////////////
   ////////////////////////////////////////
   ////  Restructure Boolean Expressions
   ////
   ////////////////////////////////////////
   ////////////////////////////////////////

   ccBooleanAnalysis._constructNegation = function(parse_tree) {
     return {
       argument: parse_tree,
       operator: this._constants.kNOT,
       prefix: true,
       type: this._constants.kUnaryExpression
     };
   };

   ccBooleanAnalysis._constructAND = function(left, right) {
     return {
       left,
       right,
       operator: this._constants.kAND,
       type: this._constants.kBinaryExpression
     };
   };

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
   };

   // Applies demorgan's rule for non-trivial cases
   ccBooleanAnalysis._convertToNegationForm = function(parse_tree) {
     if (parse_tree.type == this._constants.kIdentifier) {
       return;
     } else if (parse_tree.operator == this._constants.kNOT) {
       // Copy the argument's negation into the parse tree
       if (parse_tree.argument.type == this._constants.kIdentifier) {
         return;
       } else {
         let new_parse_tree = this._negate(parse_tree.argument);
         for (const k in new_parse_tree) {
           parse_tree[k] = new_parse_tree[k];
         }
       }
     } else {
       this._convertToNegationForm(parse_tree.left);
       this._convertToNegationForm(parse_tree.right);
     }
   };

   // Distribute ANDs across ORs
   ccBooleanAnalysis._pushDownAnds = function(parse_tree) {
     const doTransformation = (parse_tree) => {
      if (parse_tree.operator == this._constants.kAND) {
        let ret;
        if (parse_tree.right.operator == this._constants.kOR) {
          const old_left = parse_tree.left;
          parse_tree.left = this._constructAND(old_left, parse_tree.right.left);
          parse_tree.right = this._constructAND(old_left, parse_tree.right.right);
          parse_tree.operator = this._constants.kOR;
          ret = true;
        }
        else if (parse_tree.left.operator == this._constants.kOR) {
          const old_right = parse_tree.right;
          parse_tree.right = this._constructAND(parse_tree.left.right, old_right);
          parse_tree.left = this._constructAND(parse_tree.left.left, old_right);
          parse_tree.operator = this._constants.kOR;
          ret = true;
        }
        const ret1 = doTransformation(parse_tree.left);
        const ret2 = doTransformation(parse_tree.right);
        return ret || ret1 || ret2;
      }
      else if (parse_tree.operator == this._constants.kOR) {
        const ret1 = doTransformation(parse_tree.left);
        const ret2 = doTransformation(parse_tree.right);
        return ret1 || ret2;
      }
      return false;
        // Negations and terminals are terminating cases 
     }

     while(doTransformation(parse_tree));
   };

   // Get all positive and negative variables
   // structure terms as: { data: { positive: [], negative: [] } }
   // Must be in negation form to work properly
   ccBooleanAnalysis._sortTerms = function(parse_tree, terms, label_pos_neg) {
     if (parse_tree.operator == this._constants.kAND || parse_tree.operator == this._constants.kOR) {
       this._sortTerms(parse_tree.left, terms, label_pos_neg);
       this._sortTerms(parse_tree.right, terms, label_pos_neg);
     } else if (parse_tree.type == this._constants.kIdentifier) {
       if (label_pos_neg) {
         terms.data.push(`${parse_tree.name}___pos`);
       } else {
         terms.data.push(parse_tree.name);
       }
     } else if (parse_tree.operator == this._constants.kNOT) {
       if (label_pos_neg) {
         terms.data.push(`${parse_tree.argument.name}___neg`);
       } else {
         terms.data.push(parse_tree.argument.name);
       }
     }
   };


   ////////////////////////////////////////
   ////////////////////////////////////////
   ////  State Transition Graphs
   ////
   ////////////////////////////////////////
   ////////////////////////////////////////

   ccBooleanAnalysis._evaluateState = function(expression, regexes) {
     // convert the expression into a parseable form
     // regexes are regular expression forms of the assignments.
     // This function could compute the regexes based on the assignments,
     // but as this function is likely to be called many times with the same assignment,
     // the function requests precomputed regexes.
     //
     // These regexes can be generated with ccBooleanAnalysis._getRegexes(assignments).
     const mapObj = {
       'OR':'||',
       '+':'||',
       '*':'&&',
       'AND':'&&',
       '~': '!'
     };

     const replFun = (a, v1, matched, v2) => (v1||"")+mapObj[matched]+(v2||"");
     let parsable_expression = expression.replace(/(^|[^a-z0-9]|\s)(AND|OR|\+|\*)([^a-z0-9]|\s|$)/gi,replFun)
                                        .replace(/(^|[^a-z0-9]|\s)(~)([^a-z0-9]|\s|$)/gi, replFun);

     // insert the assignments into the parsable_expression
     parsable_expression = this._applyRegexes(parsable_expression, regexes);

     /*jshint -W061 */
     return eval(parsable_expression)?1:0;
   };

   ccBooleanAnalysis._applyRegexes = (parsable_expression, regexes) => {
     // This expression should be parsable (i.e. have &&, ||, etc.)
     // regexes / assignments should be generated using ccBooleanAnalysis._getRegexes.
     // This function applies those regexes to an expression.
     for (const regex of regexes) {
       parsable_expression = parsable_expression.replace(regex[0],
                (a,v1,id,v2)=> ((v1||"")+regex[1]+(v2||"")) );
     }

     return parsable_expression;
   };

   ccBooleanAnalysis._getRegexes = assignments => {
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
     const regexes = [];
     for (let key in assignments) {
       const assignment = assignments[key];
       const re = new RegExp("(^|[^0-9A-Za-z_$])("+key+")([^$0-9A-Za-z_]|$)", 'g');
       regexes.push([re, assignment.toString()]);
     }
     return regexes;
   };

   ccBooleanAnalysis.evaluateStateTransition = function(equations, terms, assignments, statics, transitions) {
     const regexes = this._getRegexes(assignments);
     const new_assignments = {};
     for ( let k in statics ) { new_assignments[k] = statics[k]; };
     
     for (const equation of equations) {
       const sides = equation.split('=');
       new_assignments[sides[0].trim()] = this._evaluateState(sides[1], regexes);
     }
//     transitions.push([assignments, new_assignments]);

     let missingTerms = terms.filter((t)=>new_assignments[t]===undefined);
     for(let i = 0; i < 1<<missingTerms.length; i++){
        let na = {};
        for(let k in new_assignments) na[k] = new_assignments[k];
        missingTerms.forEach((term,j) => {
            na[term] = (i>>j)&1;
        });
        transitions.push([assignments, na]);
     }
   };

   //Get truth table for equation
   ccBooleanAnalysis.getTruthTable = function(equation) {
     let terms = {};
     equation.replace(/[$A-Z_][0-9A-Z_$]*/gi, (id)=>{
        terms[id] = true; return id;});
     terms = Object.keys(terms).sort();

     let assignments = {};
     let ret = [terms.concat(['value'])];
     for (let i = (2 << terms.length)-1; i >= 0; --i) {
       let settings = new Array(terms.length+1);
       terms.forEach((t,j)=>{
           assignments[t] = settings[j] = (i>>j)&1 ? true : false;
       });
       settings[terms.length] = this._evaluateState(equation, this._getRegexes(assignments));
       ret.push(settings);
     }
     return ret;
   }

   ccBooleanAnalysis.stateTransitionGraph = function(equations) {
     // First, extract all identifiers from equations.
     let terms = {};
     equations.forEach((e)=>e.replace(/[$A-Z_][0-9A-Z_$]*/gi, (id)=>{
        terms[id] = true; return id;}));
     
     let statics = {};
     //simple approach to find static equations
     equations.forEach((e,i)=>{
        let eq = e.split('=')[1].replace(/^\s+/g, '').trim();
        if(eq !== '0' && eq !== '1') return;
        let k = e.split('=')[0].trim();
        statics[k] = parseInt(eq)?1:0;
        delete terms[k];
     });
     terms = Object.keys(terms);

     // Iterate through each possible combination of assignments
     // transitions is an array.
     // each element is an array of length 2.
     // The first entry is the starting assignments.
     // The second entry is the ending assignments.
     const transitions = [];

     // In order to compute the truth table, we count
     // to 2^(equations.length - 1) in binary.
     // Each digit of this binary expression gives the setting
     // of a term in the evaluation.
     for (let i = 0; i < (2 << terms.length); i++) {
//       const settings = i.toString(2);
       const assignments = {};
       for ( let k in statics ) { assignments[k] = statics[k]; };
       for (let j = 0; j < terms.length; j++) {
         const term = terms[j];
         assignments[term] = (i >> j)&1;
       }
       this.evaluateStateTransition(equations, terms, assignments, statics, transitions);
     }

     return transitions;
   };

   ////////////////////////////////////////
   ////////////////////////////////////////
   ////        Attractor Search
   ////
   ////////////////////////////////////////
   ////////////////////////////////////////
   ccBooleanAnalysis.attractorSearchExhaustive = equations => {
     const st_graph = ccBooleanAnalysis.stateTransitionGraph(equations);

   };

   ccBooleanAnalysis.attractorSearchHeuristic = (equations, num_runs, depth) => {
     const attractors = [];
     const st_graph = ccBooleanAnalysis.stateTransitionGraph(equations);

     for (let i = 0; i < num_runs; i++) {
       let random_idx = Math.floor((Math.random() * st_graph.length));
       let c_i = st_graph[st_graph];
     }
   };

   ////////////////////////////////////////
   ////////////////////////////////////////
   ////         Satisfiability
   ////
   ////////////////////////////////////////
   ////////////////////////////////////////

   // returns a Logic (logic-solver) encoding of the parse_tree
   // recursively builds the encoding
   // does not require DNF or any fancy expresion
   ccBooleanAnalysis._buildLogicFormula = function(parse_tree) {
     if (parse_tree.type == ccBooleanAnalysis._constants.kIdentifier) {
       // base case
       return parse_tree.name;
     } else if (parse_tree.type == ccBooleanAnalysis._constants.kUnaryExpression) {
       return Logic.not(this._buildLogicFormula(parse_tree.argument));
     } else if (parse_tree.operator == ccBooleanAnalysis._constants.kAND) {
       return Logic.and(this._buildLogicFormula(parse_tree.left), this._buildLogicFormula(parse_tree.right));
     } else if (parse_tree.operator == ccBooleanAnalysis._constants.kOR) {
       return Logic.or(this._buildLogicFormula(parse_tree.left), this._buildLogicFormula(parse_tree.right));
     }
   };

   // Is the given formula satisfiable?
   ccBooleanAnalysis._formulaSatisfiable = logic_formula => {
     const solver = new Logic.Solver();
     solver.require(logic_formula);
     const result = solver.solve(); // null if not satisfiable
     if (result) {
       return true;
     } else {
       return false;
     }
   };

   /**
    * @method ccBooleanAnalysis.satisfiable
    * @param {string} s A string encoding a boolean expression that should be checked for satisfiability.
    * @return {boolean} Whether the expression is satisfiable.
    */
   ccBooleanAnalysis.satisfiable = function(s) {
     const parse_tree = this.getParseTree(s);
     const logic_formula = this._buildLogicFormula(parse_tree);
     return this._formulaSatisfiable(logic_formula);
   };

   /**
    * @method ccBooleanAnalysis.compareBooleansSAT
    * @param {string} s1 A string encoding a boolean expression that should be checked for equality.
    * @param {string} s2 A string encoding a boolean expression that should be checked for equality.
    * @return {boolean} Whether the two expressions are equivalent.
    */
   ccBooleanAnalysis.compareBooleansSAT = function(s1, s2) {
     const pt1 = typeof s1 === 'string' ? this.getParseTree(s1) : s1;
     const pt2 = typeof s2 === 'string' ? this.getParseTree(s2) : s2;

     const logic_formula1 = this._buildLogicFormula(pt1);
     const logic_formula2 = this._buildLogicFormula(pt2);

     const expression = Logic.xor(logic_formula1, logic_formula2);
     return !(ccBooleanAnalysis._formulaSatisfiable(expression));
   };


   ////////////////////////////////////////
   ////////////////////////////////////////
   ////         Model Reduction
   ////
   ////////////////////////////////////////
   ////////////////////////////////////////

   // conjuctions is an array of arrays (all values in DNFObject)
   // returns new conjuctions array
   ccBooleanAnalysis.parseConjuctionsAtPoint = (conjuctions, variable, value) => {
     let anything_changed = false;
     for (let i = 0; i < conjuctions.length; i++) {
       const conjuction = conjuctions[i];
       for (let j = 0; j < conjuction[0].length; j++) { // pos variables
         if (conjuction[0][j] == variable) {
           if (value) { // true
             // if there is only one conjuction
             // and that conjuction has just one positive variable
             if (conjuction[0].length == 1 && conjuction[1].length === 0) {
               // this it the only term left in the conjuction,
               // though other conjuctions still remain.
               // But since this conjuction is true, and we only
               // need one conjuction to be true for SAT,
               // we return that the entire expression is true.
               return [true, true, 1];
             } else {
               // delete term
               conjuction[0].splice(j, 1);
               j--;
               anything_changed = true;
             }
           } else { // false
             if (conjuctions.length == 1) {
               // this is the only conjuction left. Report a constant false function.
               return [false, true, -1];
             } else {
               // delete conjuction
               conjuctions.splice(i, 1);
               i--;
               anything_changed = true;
               break;
             }
           }
         }
       }

       for (let j = 0; j < conjuction[1].length; j++) { // neg variables
         if (conjuction[1][j] == variable) {
           if (!(value)) { // true
             // if there is only one conjuction
             // and that conjuction has just one positive variable
             if (conjuction[1].length == 1 && conjuction[0].length === 0) {
               // this it the only term left in the conjuction,
               // though other conjuctions still remain.
               // But since this conjuction is true, and we only
               // need one conjuction to be true for SAT,
               // we return that the entire expression is true.
               return [true, true, 1];
             } else {
               // delete term
               conjuction[1].splice(j, 1);
               j--;
               anything_changed = true;
             }
           } else { // false
             if (conjuctions.length == 1) {
               // this is the only conjuction left. Report a constant false function.
               return [false, true, -1];
             } else {
               // delete conjuction
               conjuctions.splice(i, 1);
               i--;
               anything_changed = true;
               break;
             }
           }
         }
       }
     }
     return [conjuctions, anything_changed, 0];
     // last item in array is whether this thing is a constant term
     // -1 -> constant false
     // 1 ->  constant true
     // 0 -> not constant
   };

  // accepts equations as an array of strings
  // dependent_on and depends_on will change overtime,
  // but the beginning values still serve as a good heuristic
  // on what to analyze
  //
  // future: find data structure which lets us look up where a value in within
  // the hashtable and remove it (quickly).
  ccBooleanAnalysis.reduceModel = function(equations) {
    var equation_mapping = {}; // equation_mapping['A'] gives array of arrays of conjuctions for expr in A=(expr)
    var depends_on = {}; // depends_on['A'] gives all variables which depend on 'A'.
    var constant_term_pos = [];
    var constant_term_neg = [];
    // can derive dependent_on from equation_mapping (a flattening of the outer array in equation_mapping)

    // prepare those dictionaries
    for (var i = 0; i < equations.length; i++) {
      var equation = equations[i];
      var parts = equation.split('=');

      // Clear white space from the LHS
      parts[0] = parts[0].replace(/ /gi, "");

      // Example format of conjuctions:
      // [ [ [ 'A' ], [ 'D' ] ], [ [ 'C' ], [] ] ]
      var conjuctions = this._getValuesFlattened(this.getDNFObjectEncoding(parts[1]));

      // First, propogate any 'true' and 'false' values that are baked in.
      var result_at_point = this.parseConjuctionsAtPoint(conjuctions, 'true', true);
      if (result_at_point[2] == 1) {
        constant_term_pos.push(parts[0]);
        continue;
      } else if (result_at_point[2] == -1) {
        constant_term_neg.push(parts[0]);
        continue;
      }

      result_at_point = this.parseConjuctionsAtPoint(result_at_point[0], 'false', false);
      if (result_at_point[2] == 1) {
        constant_term_pos.push(parts[0]);
        continue;
      } else if (result_at_point[2] == -1) {
        constant_term_neg.push(parts[0]);
        continue;
      }

      // Then, set up the depends_on matrix
      equation_mapping[parts[0]] = conjuctions;
      for (let j = 0; j < conjuctions.length; j++) {
        var individual_conjuction = conjuctions[j];
        for (let k = 0; k < individual_conjuction[0].length; k++) {
          let term = individual_conjuction[0][k];
          if (!(term in depends_on)) {
            depends_on[term] = [];
          }
          depends_on[term].push(parts[0]);
        }

        for (let k = 0; k < individual_conjuction[1].length; k++) {
          let term = individual_conjuction[1][k];
          if (!(term in depends_on)) {
            depends_on[term] = [];
          }
          depends_on[term].push(parts[0]);
        }
      }
    }

    // Reduction Algorithm 1
    // Identifying and eliminating the stabilized nodes
    // See section 2.1 of Saadatpour, et al.

    // We optimize the algorithm by finding all constant functions in advance
    // and noting that a non-constant function can only become constant
    // if it depends on a constant function.
    //
    // This way, we can determine that we are at a fixed point a priori without
    // actually confirming this (saves O(N) time).

    for (let i = 0; i < constant_term_pos.length; i++) {
      let term = constant_term_pos[i];
      let dependencies = depends_on[term]; // A = B AND C ->>>>> A depends on B. A shows up in dependencies.
      for (let j = 0; j < dependencies.length; j++) {
        let dependency = dependencies[j];
        if (!(dependency in equation_mapping)) { // meaning it hasn't been removed yet by becoming constant...
          continue;
        }
        let conjuctions = equation_mapping[dependency];
        let result_at_point = this.parseConjuctionsAtPoint(conjuctions, term, true);

        if (result_at_point[2] == 1) {
          constant_term_pos.push(dependency);
          delete equation_mapping[dependency];
          continue;
        } else if (result_at_point[2] == -1) {
          constant_term_neg.push(dependency);
          delete equation_mapping[dependency];
          continue;
        } else {
          equation_mapping[dependency] = result_at_point[0];
        }
      }
    }

    // Basically same code for negatives
    for (let i = 0; i < constant_term_neg.length; i++) {
      let term = constant_term_neg[i];
      let dependencies = depends_on[term];
      for (let j = 0; j < dependencies.length; j++) {
        let dependency = dependencies[j];
        if (!(dependency in equation_mapping)) { // meaning it hasn't been removed yet by becoming constant...
          continue;
        }
        let conjuctions = equation_mapping[dependency];
        let result_at_point = this.parseConjuctionsAtPoint(conjuctions, term, false);

        if (result_at_point[2] == 1) {
          constant_term_pos.push(dependency);
          delete equation_mapping[dependency];
          continue;
        } else if (result_at_point[2] == -1) {
          constant_term_neg.push(dependency);
          delete equation_mapping[dependency];
          continue;
        } else {
          equation_mapping[dependency] = result_at_point[0];
        }
      }
    }

    // Reduction Algorithm 2
    // Merging simple mediator nodes
    // See section 2.1 of Saadatpour, et al.

    // a -> b -> c ------> a -> c
    const inDegreeOneDependency = eq_conjuctions => {
      // returns false if the in-degree is > 1
      // otherwise, returns the dependency, whether the term is pos (True) / neg (False)

      // If there are multiple conjuctions, there must be
      // multiple variables. Becuase otherwise, these variables
      // would have been removed in a pre-processing step.
      // I.e. we would never see (A OR NOT A).
      // We might see (A OR (NOT A AND B)),
      // but the in-degree is >1 here.
      if (eq_conjuctions.length > 1) {
        return false;
      }
      // If there are variables in both the true and false sections
      // of the conjuction, then in-degree must be > 1.
      else if (eq_conjuctions[0][0].length + eq_conjuctions[0][1].length > 1) {
        return false;
      }
      // there is one variable in the positive section
      else if (eq_conjuctions[0][0].length == 1 && eq_conjuctions[0][1].length === 0) {
        return [eq_conjuctions[0][0][0], true];
      }
      // there is one variable in the negative section
      else if (eq_conjuctions[0][0].length === 0 && eq_conjuctions[0][1].length == 1) {
        return [eq_conjuctions[0][1][0], false];
      }
    };

    // If a term is in in_degree_one_mat, then it has in_degree_one.
    // It's value in the hash_map is [its_dependency, pos/neg reliance]
    let in_degree_one_mat = {};
    for (var term in equation_mapping) {
      const result = inDegreeOneDependency(equation_mapping[term]);
      if (result) {
        in_degree_one_mat[term] = result;
      }
    }

    // Find mediator nodes
    for (let term in in_degree_one_mat) {
      // keep_going allows us to keep collapsing terms
      // until the chain ends
      let keep_going = true;
      while (keep_going) {
        const back_dependency_1_info = in_degree_one_mat[term];
        if (back_dependency_1_info[0] in in_degree_one_mat) {
          const back_dependency_2_info = in_degree_one_mat[back_dependency_1_info[0]];

          // Update the chain
          if (back_dependency_1_info[1] == back_dependency_2_info[1]) { // true/true of false/false gives positive
            equation_mapping[term] = [ [ [ back_dependency_2_info[0] ], [] ] ];
            in_degree_one_mat[term] = [back_dependency_2_info[0], true];
          } else {
            equation_mapping[term] = [ [ [], [ back_dependency_2_info[0] ] ] ];
            in_degree_one_mat[term] = [back_dependency_2_info[0], false];
          }

          // Remove the mediator node
          delete equation_mapping[back_dependency_1_info[0]];
          delete in_degree_one_mat[back_dependency_1_info[0]];
        } else {
          // if there is no mediator node, move onto the next term
          keep_going = false;
        }
      }
    }

    // returns a hash_table representing the conjuctions for each term
    // can be interconverted into parse_tree or similar, as needed.
    return equation_mapping;
  };

  module.exports = ccBooleanAnalysis;
// });
