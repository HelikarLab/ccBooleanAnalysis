ccBooleanAnalysis.getParseTree = function(s) {
  // Since unaryOps appear broken...
  var find = 'NOT';
  var re = new RegExp(find, 'g');
  s = s.replace(re, '~');

  var find = 'AND';
  var re = new RegExp(find, 'g');
  s = s.replace(re, '*');

  var find = 'OR';
  var re = new RegExp(find, 'g');
  s = s.replace(re, '+');

  return ccBooleanAnalysis.jsep(s);
}
