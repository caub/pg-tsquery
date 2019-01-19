/**
 * parse any string to a valid pg tsquery
 * @param  {string} q
 * @returns {string}
 */
module.exports = function tsquery(q) {
  return toStr(parse(q || ''));
}

// consume unparsable tail string (when too many closing parens, ex: 'foo ) bar')
function parse(str) {
  let node = parseOr(str);
  let tail = node && node.input && node.input.replace(/^[\s|,&+<:)\]]+/, '');
  while (tail) {
    const right = parseOr(tail);
    if (!right) {
      return node;
    }
    node = {
      type: /^[|,]/.test(tail) ? '|' : '&',
      left: node,
      right,
      input: right.input,
    };
    tail = node.input;
  }
  return node;
}

const SEP = /^[\s|,&+<:!-]*/; // what we define as punctuation

const OR = /^\s*(?:[|,]|or)/i;

function parseOr(str) {
  let s = str;
  let node;

  do {
    const s2 = s.replace(OR, '');
    const right = parseAnd(s2);
    if (!right) {
      return node;
    }
    node = node
      ? {
        type: '|',
        left: node,
        right,
        input: right.input,
      }
      : right;

    s = node.input;
  } while (node && node.input);

  return node;
}

const AND = /^(?!\s*(?:[|,]|or))(?:[\s&+:|,!-]|and)*/i;

function parseAnd(str) {
  let node = parseFollowBy(str);

  while (node && node.input) {
    const m = node.input.match(AND);

    if (!m) {
      return node;
    }

    const s = node.input.slice(m[0].length);
    const m2 = s.match(SEP);
    const right = parseFollowBy(s.slice(m2[0].length));

    if (!right) {
      return node;
    }

    right.negated = right.negated || /[!-]$/.test(m[0]) || /[!-]$/.test(m2[0]);

    node = {
      type: '&',
      left: node,
      right,
      input: right.input,
    };
  }
  return node;
}

const FOLLOWED_BY = /^\s*<(?:(?:(\d+)|-)?>)?/;

function parseFollowBy(str) {
  let node = parseWord(str);

  while (node && node.input) {
    const m = node.input.match(FOLLOWED_BY);

    if (!m) {
      return node;
    }

    const s = node.input.slice(m[0].length);
    const m2 = s.match(SEP);
    const right = parseWord(s.slice(m2[0].length));

    if (!right) {
      return node;
    }

    right.negated = right.negated || /[!-]$/.test(m2[0]);

    node = {
      type: m[1] ? `<${m[1]}>` : '<->',
      left: node,
      right,
      input: right.input,
    };
  }
  return node;
}

const WORD = /^[\s*&+<:,|]*([\s!-]*)([^\s|,&+<:*()[\]!-]+)/;

function parseWord(str) {
  const s = str.trimStart();
  const par = s.match(/^\s*[!-]*[([]/);
  if (par) {
    const s2 = s.slice(par[0].length);
    const node = parseOr(s2);
    if (node) {
      node.negated = node.negated || par[0].length > 1;
      node.input = node.input.trimStart().replace(/^[)\]]/, '');
    }
    return node;
  }
  const m = s.match(WORD);

  if (m === null) {
    return;
  }
  const next = s.slice(m[0].length);
  const prefix = next.match(/^(\*|:\*)*/)[0];
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
  return s ? s + '(' + leftStr + node.type + rightStr + ')' : leftStr + node.type + rightStr;
}
