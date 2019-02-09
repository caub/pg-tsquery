/**
 * @typedef { import("./index").TsqueryOptions } TsqueryOptions
 */

/** @type {TsqueryOptions} */
const defaultOpts = {
  or: /^\s*(?:[|,]|or)/i,
  and: /^(?!\s*(?:[|,]|or))(?:[\s&+:|,!-]|and)*/i, // /^\s*(?:[\s&+:|,!-]|and)*/i,
  followedBy: /^\s*>/, // /^\s*<(?:(?:(\d+)|-)?>)?/,
  word: /^[\s*&+<:,|]*(?<negated>[\s!-]*)[\s*&+<:,|]*(?:(?<quote>["'])(?<phrase>.*?)\k<quote>|(?<word>[^\s,|&+<>:*()[\]!-]+))/,
  quotedWordSep: /(?:[\s<()|&!]|:\*)+/, // those are mostly tsquery operator, not removing them would cause errors
  parStart: /^\s*[!-]*[([]/,
  parEnd: /^[)\]]/,
  negated: /[!-]$/,
  prefix: /^(\*|:\*)*/,
  tailOp: '&',
};

/**
 * Initializes tsquery parser
 * @param  {TsqueryOptions} opts
 * @returns {function} qString => parsedQString
 */
module.exports = function tsquery(opts) {
  return q => toStr(parse(q || '', { ...defaultOpts, ...opts }));
}

function parse(str, opts) {
  let node = parseOr(str, opts);
  let tail = node && node.input;
  while (tail && opts.tailOp) {
    tail = tail.slice(1);
    const right = parseOr(tail, opts);
    if (right) {
      node = {
        type: opts.tailOp,
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

  while (node && node.input && opts.or) {
    const m = node.input.match(opts.or);
    if (!m) return node;
    const s = node.input.slice(m[0].length);
    const right = parseAnd(s, opts);
    if (!right) return node;
    right.negated = right.negated || opts.negated.test(m[0]);
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

  while (node && node.input && opts.and) {
    const m = node.input.match(opts.and);
    if (!m) return node;
    const s = node.input.slice(m[0].length);
    const right = parseFollowedBy(s, opts);
    if (!right) return node;
    right.negated = right.negated || opts.negated.test(m[0]);
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

  while (node && node.input && opts.followedBy) {
    const m = node.input.match(opts.followedBy);
    if (!m) return node;
    const s = node.input.slice(m[0].length);
    const right = parseWord(s, opts);
    if (!right) return node;
    right.negated = right.negated || opts.negated.test(m[0]);
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
  const par = s.match(opts.parStart);
  if (par) {
    const s2 = s.slice(par[0].length);
    const node = parseOr(s2, opts);
    if (node) {
      node.negated = node.negated || par[0].length > 1;
      node.input = node.input.trimStart().replace(opts.parEnd, '');
    }
    return node;
  }
  const m = s.match(opts.word);

  if (m === null || !m.groups) {
    return;
  }
  const next = s.slice(m[0].length);
  const prefix = opts.prefix ? next.match(opts.prefix)[0] : '';
  const input = next.slice(prefix.length);
  const value = m.groups.word || `"${m.groups.phrase.split(opts.quotedWordSep).join('<->')}"`; // it looks nasty, but to_tsquery will handle this well, see tests
  const negated = !!m.groups.negated;
  return {
    value,
    negated,
    input,
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
