var util = require("util");

function isVarSymbol(sym) {
  return sym >= 'a' && sym <= 'z' || sym >= 'A' && sym <= 'Z' && sym >= '0' && sym <= '9';
}

function isSpaceSymbol(sym) {
  return sym === ' ' || sym === '\t';
}

function printVal(generatorValue) {
  if (generatorValue.done) return 'EOF';
  var val = generatorValue.value;
  if (val.identifier) return val.identifier;
  if (val.lambda) return val.lambda;
  if (val.dot) return val.dot;
  if (val.space) return val.space;
  if (val.openingBrace) return val.openingBrace;
  if (val.closingBrace) return val.closingBrace;
}

function tokenize(expr) {
  var ind = 0, tokens = [], length, sym, identifier;
  if (!expr || !expr.trim().length) return tokens;

  expr = expr.trim();
  length = expr.length;

  while (ind !== length) {
    sym = expr[ind];
    if (sym === '\\' || sym === 'λ') {
      tokens.push({lambda: 'λ', ind: ind});
    }
    else if (sym === '.') {
      tokens.push({dot: '.', ind: ind});
    }
    else if (sym === '(') {
      tokens.push({openingBrace: '(', ind: ind});
    }
    else if (sym === ')') {
      tokens.push({closingBrace: ')', ind: ind});
    }
    else if (isVarSymbol(sym)) {
      identifier = sym;
      while(++ind < length && isVarSymbol(expr[ind])) {
        identifier += expr[ind];
      }
      ind--;
      tokens.push({identifier: identifier, ind: ind});
    }
    else if (isSpaceSymbol(sym)) {
      while(++ind < length && isSpaceSymbol(expr[ind])) {}
      ind--;
      tokens.push({space: ' ', ind: ind});
    }
    else {
      throw `Unrecognized character met: ${sym}`;
    }

    ind++;
  }

  return tokens;
}

/*
 * <expr>   ::= 'λ' <var> '.' <expr>
 *            | <braces>
 *            | <var>
 * <braces> ::= '(' <expr> <exprs> ')'
 * <exprs>  ::= <expr> <exprs>
 *            | ε
 */

function skipSpaces(tokens, current) {
  while (current !== tokens.length && tokens[current].space) {
    current++;
  }
  return current;
}

function expect(tokens, current, expected) {
  var next = tokens[current], expr;
  console.log('expecting', expected);
  if (!next[expected])
    throw `Expected ${expected}, got ${printVal(next)}.`;
}

function parse(expr) {
  var tokens = tokenize(expr);
      current = 0;

  function parseLambda() {
    console.log('parseLambda', current);

    expect(tokens, current++, 'lambda');

    var arg = tokens[current], body;

    if (!arg.identifier)
      throw `Expected identifier, got ${printVal(arg)}.`;

    expect(tokens, ++current, 'dot');

    body = parseExpr(tokens, ++current);
    return ['λ', arg.identifier, body];
  }

  function parseBraces() {
    console.log('parseBraces', current);

    expect(tokens, current++, 'openingBrace');

    var expr = parseExpr(),
        exprs = parseExprs();

    // console.log('parse braces', expr, exprs, [expr].concat(exprs));
    return [expr].concat(exprs);
  }

  function parseExprs() {
    console.log('parseExprs', current);

    var exprs = [], next;
    do {
      if (current === tokens.length) {
        throw 'Unexpected EOF, expected closing brace.';
      }

      next = tokens[++current];

      if (next.closingBrace) {
        break;
      }

      exprs.push(parseExpr());
    } while(true);

    return exprs;
  }

  function parseExpr() {
    console.log('parseExpr', current);

    if (current === tokens.length) return;

    current = skipSpaces(tokens, current);
    var token = tokens[current];

    if (token.lambda) {
      return parseLambda();
    }
    if (token.openingBrace) {
      return parseBraces();
    }
    if (token.identifier) {
      return token.identifier;
    }
  }

  return parseExpr();
}

function test(expr) {
  try {
    var ast = parse(expr);
    console.log('\t', expr);
    console.log(util.inspect(ast, {depth: null}), '\n');
  } catch (err) {
    console.error(`Error parsing ${expr}: ${err}`);
  }
}

// test('λx.x')
// test('λx.(λy.(y y) x x)')
// test('λs.λz.(s(z))');
// test('λy.(y y)');  
test('λs.λz.(s(s(z)))');
// test('λsλz.s(z)'); // TODO: legit, need to support
// test('λsz.s(z)');  // TODO: maybe, if agree to use single letter vars
// test('λy.y.y');    // TODO: Should fail

exports.tokenize = tokenize;
exports.parse = parse;
