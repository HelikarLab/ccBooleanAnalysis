// Misc.

// Clone a javascript object / dictionary
ccBooleanAnalysis._clone = function(dict) {
  return $.extend({}, dict);
}

// Return unique vlaues
// use as follows:
// data.filter(ccBooleanAnalysis._uniqueFilter)
ccBooleanAnalysis._uniqueFilter = function(value, index, self) {
  return self.indexOf(value) == index;
}

// Boolean
// do two arrays share a common term?
ccBooleanAnalysis._shares_term = function(a, b) {
  var ai=0, bi=0;
  var result = [];

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
}

// Removes shared variables from two arrays and returns them
// in a new array.
// Input must be sorted.
// Output is sorted.
ccBooleanAnalysis._remove_intersection = function(a, b) {
  var ai=0, bi=0;
  var result = [];

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
}

// Returns the union of two arrays
// Input must be sorted.
// Output is sorted.
ccBooleanAnalysis._get_union = function(a, b) {
  var ai=0, bi=0;
  var result = [];

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

  return result;
}

// Find the intersection of two arrays without modifying
// those arrays.
// Input must be sorted.
// Output is sorted.
ccBooleanAnalysis._get_intersection = function(a, b) {
  var ai=0, bi=0;
  var result = [];

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
}

// Is a a subset of b?
// Is b a subset of a?
//
// returns:
// 0 - no subsets
// 1 - a is subset of b (a < b)
// 2 - b is subset of a (b < a)
ccBooleanAnalysis._is_subset = function(a, b) {
  var intersection_len = this._get_intersection(a, b).length;
  if (a.length === intersection_len) {
    return 1;
  } else if (b.length === intersection_len) {
    return 2;
  }
  return 0;
}
