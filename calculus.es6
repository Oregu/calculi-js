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

function expect(lexems, token) {
  var next = lexems.next(), expr;
  console.log('expecting', token);
  if (next.done || !next.value[token])
    throw `Expected ${token}, got ${printVal(next)}.`;
}

function parseLambda(lexems) {
  console.log('parseLambda');
  var next = lexems.next(), arg, body;
  if (next.done || !next.value.identifier)
    throw `Expected identifier, got ${printVal(next)}.`;

  arg = next.value.identifier;
  expect(lexems, 'dot');
  body = parseExpr(lexems);
  return ['λ', arg, body];
}

function parseBraces(lexems) {
  console.log('parseBraces');
  var expr = parseExpr(lexems),
      exprs = parseExprs(lexems);
  console.log('parse braces', expr, exprs, [expr].concat(exprs));
  return [expr].concat(exprs);
}

function parseExprs(lexems) {
  console.log('parseExprs');
  var exprs = [], next;
  do {
    next = lexems.next()
    if (next.done) {
      throw 'Unexpected EOF, expected closing brace.';
    }
    if (next.value.closingBrace) {
      break;
    }
    if (next.value.space) {
      continue;
    }
    exprs.push(parseExpr(lexems, next));
  } while(true);

  return exprs;
}

function parseExpr(lexems, next) {
  console.log('parseExpression');
  next = next || lexems.next();
  if (next.done) return;

  if (next.value.lambda) {
    return parseLambda(lexems);
  }
  if (next.value.openingBrace) {
    var braces = parseBraces(lexems);
    console.log('braces got', braces);
    return braces;
  }
  if (next.value.identifier) {
    return next.value.identifier;
  }
}

function parse(expr) {
  var lex = lexems(expr),
      ast = parseExpr(lex),
      next = lex.next();
  if (!next.done) {
    throw `Unexpected symbol: ${printVal(next)}`;
  }
  return ast;
}

function test(expr) {
  try {
    var ast = tokenize(expr);
    console.log('\t', expr);
    console.log(util.inspect(ast, {depth: null}), '\n');
  } catch (err) {
    console.error(`Error parsing ${expr}: ${err}`);
  }
}

test('λx.x')
test('λx.(λy.(y y) x x)')
test('λs.λz.(s(z))');
test('λs.λz.(s(s(z)))');
test('λsλz.s(z)');
test('λsz.s(z)');
test('λy.(y y)');
test('λy.y.y');

exports.tokenize = tokenize;
exports.parse = parse;
