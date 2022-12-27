/**
 * @typedef { import("./index").TsqueryOptions } TsqueryOptions
 */

const PRECEDENCES = {
  '|': 0,
  '&': 1,
  '<': 2,
};

class Node {
  constructor({ type, input, negated, left, right, value, prefix, quoted }) {
    this.type = type; // '&'|'|'|'<->'|'<1>'|'<2>'.. or undefined if a word node (leaf node)
    this.input = input; // remaining string to parse
    this.negated = negated; // boolean
    this.left = left; // Node
    this.right = right; // Node
    this.value = value; // word node string value
    this.prefix = prefix; // word node prefix when using a :* operator
    this.quoted = quoted; // whether the node is wrapped in quotes (aka websearch_to_tsquery)
  }

  toString() {
    if (!this.type) {
      if (!this.value) return ''; // avoid just ! (negated empty word, shouldn't happen with proper non-empty word regex tho)

      const prefixed = `${this.value}${this.prefix ? ':*' : ''}`;
      return this.negated && this.quoted
        ? `!(${prefixed})`
        : `${this.negated ? '!' : ''}${prefixed}`;
    }

    let left = this.left;
    let right = this.right;

    if (left.type && PRECEDENCES[this.type[0]] > PRECEDENCES[left.type[0]] && !left.negated) {
      // wrap left in parens
      left = `(${left})`;
    }
    if (right.type && PRECEDENCES[this.type[0]] > PRECEDENCES[right.type[0]] && !right.negated) {
      // wrap right in parens
      right = `(${right})`;
    }
    const content = `${left}${this.type}${right}`;
    return this.negated ? `!(${content})` : content;
  }
}


class Tsquery {
  /**
   * 
   * @param {TsqueryOptions} opts 
   */
  constructor({
    or = /^\s*(?:[|,]|or)/i,
    and = /^(?!\s*(?:[|,]|or))(?:[\s&+:|,!-]|and)*/i, // /^\s*(?:[\s&+:|,!-]|and)*/i,
    followedBy = /^\s*>/, // /^\s*<(?:(?:(\d+)|-)?>)?/,
    word = /^[\s*&+<:,|]*(?<negated>[\s!-]*)[\s*&+<:,|]*(?:(?<quote>["'])(?<phrase>.*?)\k<quote>|(?<word>[^\s,|&+<>:*()[\]!]+))/,
    quotedWordSep = /(?:[\s<()|&!]|:\*)+/, // those are mostly tsquery operator, not removing them would cause errors
    parStart = /^\s*[!-]*[([]/,
    parEnd = /^[)\]]/,
    negated = /[!-]$/,
    prefix = /^(\*|:\*)*/,
    tailOp = '&',
    singleQuoteReplacement = '',

  } = {}) {
    this.or = or;
    this.and = and;
    this.followedBy = followedBy;
    this.word = word;
    this.quotedWordSep = quotedWordSep;
    this.parStart = parStart;
    this.parEnd = parEnd;
    this.negated = negated;
    this.prefix = prefix;
    this.tailOp = tailOp;
    this.singleQuoteReplacement = singleQuoteReplacement;
  }

  parseAndStringify(str) {
    return `${this.parse(str) || ''}`;
  }

  /**
   * Parse string as a Node tree, invoke .toString() to get back a string value for thta tree
   * @param {string} str
   * @returns {Node|undefined} 
   */
  parse(str) {
    let node = this.parseOr(str);
    let tail = node && node.input;
    while (tail && this.tailOp) {
      tail = tail.slice(1);
      const right = this.parseOr(tail);
      if (right) {
        node = new Node({
          type: this.tailOp,
          input: right.input,
          negated: false,
          left: node,
          right,
          value: undefined,
          prefix: undefined,
          quoted: undefined,
        });
        tail = node.input;
      }
    }
    return node;
  }

  /**
   * 
   * @returns {Node|undefined} 
   */
  parseOr(str) {
    let node = this.parseAnd(str);

    while (node && node.input && this.or) {
      const m = node.input.match(this.or);
      if (!m) return node;
      const s = node.input.slice(m[0].length);
      const right = this.parseAnd(s);
      if (!right) return node;
      right.negated = right.negated || this.negated.test(m[0]);
      node = new Node({
        type: '|',
        input: right.input,
        negated: false,
        left: node,
        right,
        value: undefined,
        prefix: undefined,
        quoted: undefined,
      });
    }
    return node;
  }

  /**
   * 
   * @returns {Node|undefined} 
   */
  parseAnd(str) {
    let node = this.parseFollowedBy(str);

    while (node && node.input && this.and) {
      const m = node.input.match(this.and);
      if (!m) return node;
      const s = node.input.slice(m[0].length);
      const right = this.parseFollowedBy(s);
      if (!right) return node;
      right.negated = right.negated || this.negated.test(m[0]);
      node = new Node({
        type: '&',
        input: right.input,
        negated: false,
        left: node,
        right,
        value: undefined,
        prefix: undefined,
        quoted: undefined,
      });
    }
    return node;
  }

  /**
   * 
   * @returns {Node|undefined} 
   */
  parseFollowedBy(str) {
    let node = this.parseWord(str);

    while (node && node.input && this.followedBy) {
      const m = node.input.match(this.followedBy);
      if (!m) return node;
      const s = node.input.slice(m[0].length);
      const right = this.parseWord(s);
      if (!right) return node;
      right.negated = right.negated || this.negated.test(m[0]);
      node = new Node({
        type: m[1] ? `<${m[1]}>` : '<->',
        input: right.input,
        negated: false,
        left: node,
        right,
        value: undefined,
        prefix: undefined,
        quoted: undefined,
      });
    }
    return node;
  }

  /**
   * 
   * @returns {Node|undefined} 
   */
  parseWord(str) {
    const s = str.trimStart();
    const par = s.match(this.parStart);
    if (par) {
      const s2 = s.slice(par[0].length);
      const node = this.parseOr(s2);
      if (node) {
        node.negated = node.negated || par[0].length > 1;
        node.input = node.input.trimStart().replace(this.parEnd, '');
      }
      return node;
    }
    const m = s.match(this.word);

    if (m === null || !m.groups) {
      return;
    }
    const next = s.slice(m[0].length);
    const prefix = this.prefix ? next.match(this.prefix)[0] : '';
    const input = next.slice(prefix.length);
    const value = m.groups.word
      ? m.groups.word.replace(/'/g, this.singleQuoteReplacement) // replace single quotes, else you'd get a syntax error in pg's ts_query
      : `"${m.groups.phrase.split(this.quotedWordSep).join('<->')}"`; // it looks nasty, but to_tsquery will handle this well, see tests, in the end it behaves like websearch_to_tsquery
    const negated = !!m.groups.negated;

    return new Node({
      type: undefined,
      value,
      negated,
      left: undefined,
      right: undefined,
      input,
      prefix,
      quoted: !!m.groups.quote,
    });
  }
}

/**
 * Initializes tsquery parser
 * @param  {TsqueryOptions} opts
 * @returns {(string) => string}
 */
function tsquery(opts) {
  const parser = new Tsquery(opts);
  return str => `${parser.parse(str) || ''}`;
}

tsquery.Tsquery = Tsquery;
tsquery.Node = Node;

module.exports = tsquery;
