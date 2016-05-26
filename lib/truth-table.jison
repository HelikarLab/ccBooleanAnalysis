%lex

%%

\s+ /* Ignore White Space */

[a-zA-Z_][a-zA-Z0-9_]* return "IDENTIFIER";
"!"                    return "!";
"("                    return "(";
")"                    return ")";
"*"                    return "*";
"+"                    return "+";
<<EOF>>                return "EOF";

/lex

%left identifier
%right "("
%left ")"
%right "!"
%left "*"
%left "+"

%start statement

%%

statement: /* ϵ */ EOF %{
    // If an exception is thrown, then you may want to parse an empty string to
    // reset the state of the record variable.  Otherwise, you may find
    // successive calls to #parse return more variables then were in your
    // expression (residue of previous expressions).
    record._params = {};
    return {
      params: [],
      js: '',
      tex: '',
      fn: function() { return true; }
    };
  %}
  | expression EOF %{
    var params = record.params();
    var js = $1.js;
    var tex = $1.tex;
    var fn = new Function(params, "return " + js + ";");
    record._params = {};
    return {
      params: params,
      js: js,
      tex: tex,
      fn: fn
    };
  %}
  ;

expression:
  "(" expression ")" expression {
    $$ = {
      js: "(" + $2.js + ") && " + $4.js,
      tex: "\\left(" + $2.tex + "\\right) \\land " + $4.tex
    };
  }
  | "(" expression ")" {
    $$ = {
      js: "(" + $2.js + ")",
      tex: "\\left(" + $2.tex + "\\right)"
    };
  }
  | expression "+" expression {
    $$ = {
      js: $1.js + " || " + $3.js,
      tex: $1.tex + " \\lor " + $3.tex
    };
  }
  | expression "*" expression {
    $$ = {
      js: $1.js + " && " + $3.js,
      tex: $1.tex + " \\land " + $3.tex
    };
  }
  | "!" expression {
    $$ = {
      js: "!" + $2.js,
      tex: "\\lnot " + $2.tex
    };
  }
  | identifier expression {
    $$ = {
      js: $1.js + " && " + $2.js,
      tex: $1.tex + " \\land " + $2.tex
    };
  }
  | identifier {
    $$ = $1;
  }
  ;

identifier: IDENTIFIER %{
  var x = record.param($1);
  $$ = {
    js: x,
    tex: x
  };
%};

%%

var record = {
  _params: {},
  param: function (x) {
    this._params[x] = true;
    return x;
  },
  params: function () {
    var param, params = [];
    for (param in this._params) {
      if (this._params.hasOwnProperty(param)) {
        params.push(param);
      }
    }
    return params;
  }
};

/* vim: set et sw=2 ts=2 sta ft=lex: */
