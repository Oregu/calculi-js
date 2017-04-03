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
  if (!next[expected])
    throw `Expected ${expected}, got ${printVal(next)}.`;
}

function parse(expr) {
  let tokens = tokenize(expr),
      current = 0;

  function parseLambda() {
    expect(tokens, current++, 'lambda');

    var arg = tokens[current], body;

    if (!arg.identifier)
      throw `Expected identifier, got ${printVal(arg)}.`;

    expect(tokens, ++current, 'dot');

    body = parseExpr(tokens, ++current);
    return ['λ', arg.identifier, body];
  }

  function parseBraces() {
    expect(tokens, current++, 'openingBrace');

    const expr = parseExpr(),
          exprs = parseExprs();

    // console.log('parse braces', expr, exprs, [expr].concat(exprs));
    return [expr].concat(exprs);
  }

  function parseExprs() {
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
    if (current === tokens.length) return;

    current = skipSpaces(tokens, current);
    const token = tokens[current];

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

exports.parse = parse;
