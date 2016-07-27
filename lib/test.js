var Logic = require('logic-solver')
var solver = new Logic.Solver();
solver.require(Logic.atMostOne("Alice", "Bob"));
solver.require(Logic.or("Bob", "Charlie"));
var sol1 = solver.solve();
var a = sol1.getTrueVars();
console.log(a);
