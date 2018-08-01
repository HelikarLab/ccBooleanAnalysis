// Boolean comparisons
$(document).ready(function() {
  $('#comparison_submit').click(function() {
    var comparison_1 = $("#comparison_1").val();
    var comparison_2 = $("#comparison_2").val();

    if (comparison_1 != "" && comparison_2 != "") {
      var comparison = ccBooleanAnalysis.compareBooleans(comparison_1, comparison_2);
      if (comparison == true) {
       $("#comparison_result").text('Equal');
      } else {
        $("#comparison_result").text('Not Equal');
      }
    }
    return false;
  });

  $('#feedback_loop_submit').click(function() {
    var feedback_loop_array = eval($("#feedback_loop").val());
    if (feedback_loop_array && feedback_loop_array.constructor === Array) {
      var feedback_loops = ccBooleanAnalysis.feedbackLoops(feedback_loop_array);
      var result = "";

      for (var i = 0; i < feedback_loops.length; i++) {
        var feedback_loop = feedback_loops[i];
        result += feedback_loop.join(' ~> ') + '<br>';
      }
      $('#feedback_loop_result').html(result);
    }
    return false;
  });

  $('#circuit_submit').click(function() {
    var circuit_array = eval($("#circuit").val());
    if (circuit_array && circuit_array.constructor === Array) {
      var circuits = ccBooleanAnalysis.functionalCircuits(circuit_array);
      var result = "";

      for (var i = 0; i < circuits.length; i++) {
        var circuit = circuits[i];

        if (circuit.type == 0) {
          result += "POSITIVE: ";
        } else {
          result += "NEGATIVE: ";
        }
        result += circuit.cycle.join(' ~> ') + '<br>';
      }
      $('#circuit_result').html(result);
    }
    return false;
  });
});
