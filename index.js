/**
 * Initializes tsquery parser
 * @param  {object} 
 * @returns {function} qString => parsedQString
 */
module.exports = function tsquery({
  OR = /^\s*(?:[|,]|or)/i, // regex for OR operator
  AND = /^(?!\s*(?:[|,]|or))(?:[\s&+:|,!-]|and)*/i, // regex for AND operator
  FOLLOWED_BY = /^\s*<(?:(?:(\d+)|-)?>)?/, // regex for FOLLOWED_BY operator
  WORD = /^[\s*&+<:,|]*([\s!-]*)[\s*&+<:,|]*([^\s,|&+<:*()[\]!-]+)/, // regex for a WORD
  PAR_START = /^\s*[!-]*[([]/, // regex for start of parenthesized group
  PAR_END = /^[)\]]/, // regex for  end of parenthesized group
  NEGATED = /[!-]$/, // regex to detect if the expression following an operator is negated, this is useful for example with 'foo!bar', you can parse it as foo&!bar by adding the negation as part of AND
  PREFIX = /^(\*|:\*)*/, // regex for detecting prefix operator (placed at the end of a word to match words starting like it)
  TAIL_OP = '&', // default operator to use with tail (unparsed suffix of the query, if any)
} = {}) {
  return q => toStr(parse(q || '', { OR, AND, FOLLOWED_BY, WORD, PAR_START, PAR_END, NEGATED, PREFIX, TAIL_OP }));
}

function parse(str, opts) {
  let node = parseOr(str, opts);
  let tail = node && node.input;
  while (tail) {
    tail = tail.slice(1);
    const right = parseOr(tail, opts);
    if (right) {
      node = {
        type: opts.TAIL_OP,
        left: node,
        right,
        input: right.input,
      };
      tail = node.input;
    }
  }
  return node;
}

function parseOr(str, opts) {
  let node = parseAnd(str, opts);

  while (node && node.input) {
    const m = node.input.match(opts.OR);
    if (!m) return node;
    const s = node.input.slice(m[0].length);
    const right = parseAnd(s, opts);
    if (!right) return node;
    right.negated = right.negated || opts.NEGATED.test(m[0]);
    node = {
      type: '|',
      left: node,
      right,
      input: right.input,
    };
  }
  return node;
}

function parseAnd(str, opts) {
  let node = parseFollowedBy(str, opts);

  while (node && node.input) {
    const m = node.input.match(opts.AND);
    if (!m) return node;
    const s = node.input.slice(m[0].length);
    const right = parseFollowedBy(s, opts);
    if (!right) return node;
    right.negated = right.negated || opts.NEGATED.test(m[0]);
    node = {
      type: '&',
      left: node,
      right,
      input: right.input,
    };
  }
  return node;
}

function parseFollowedBy(str, opts) {
  let node = parseWord(str, opts);

  while (node && node.input) {
    const m = node.input.match(opts.FOLLOWED_BY);
    if (!m) return node;
    const s = node.input.slice(m[0].length);
    const right = parseWord(s, opts);
    if (!right) return node;
    right.negated = right.negated || opts.NEGATED.test(m[0]);
    node = {
      type: m[1] ? `<${m[1]}>` : '<->',
      left: node,
      right,
      input: right.input,
    };
  }
  return node;
}

function parseWord(str, opts) {
  const s = str.trimStart();
  const par = s.match(opts.PAR_START);
  if (par) {
    const s2 = s.slice(par[0].length);
    const node = parseOr(s2, opts);
    if (node) {
      node.negated = node.negated || par[0].length > 1;
      node.input = node.input.trimStart().replace(opts.PAR_END, '');
    }
    return node;
  }
  const m = s.match(opts.WORD);

  if (m === null) {
    return;
  }
  const next = s.slice(m[0].length);
  const prefix = next.match(opts.PREFIX)[0];
  return {
    value: m[2],
    negated: m[1],
    input: next.slice(prefix.length),
    prefix,
  };
}

const PRECEDENCES = {
  '|': 0,
  '&': 1,
  '<': 2,
};

function toStr(node = {}) {
  const s = node.negated ? '!' : '';
  const type = node.type;
  if (!type) {
    return node.value && s + node.value + (node.prefix ? ':*' : ''); // avoid just '!'
  }

  let leftStr = toStr(node.left);
  let rightStr = toStr(node.right);

  if (node.left.type && PRECEDENCES[node.type[0]] > PRECEDENCES[node.left.type[0]] && !node.left.negated) {
    // wrap left in parens
    leftStr = '(' + leftStr + ')';
  }
  if (node.right.type && PRECEDENCES[node.type[0]] > PRECEDENCES[node.right.type[0]] && !node.right.negated) {
    // wrap right in parens
    rightStr = '(' + rightStr + ')';
  }
  const content = leftStr + node.type + rightStr;
  return s ? s + '(' + content + ')' : content;
}
