/*

parse any string to a valid pg tsquery (return string)

*/

module.exports = tsquery;
tsquery.tsquery = tsquery;
tsquery.parse = parseOr;
tsquery.toStr = toStr;


/*
Or ::= And (/\s*[|,]/ And)* 
And ::= Factor (/\s*[&+]/ Factor)* 
Factor ::= /[!-]?/ (Word | '(' Or ')')
Word ::= /[^\s()<&|:]+/
*/

/*

Node: {
	input: String // remaining input string to parse
	value: String // matched value in input
	type: Enum ('|', '&', 'w')
	negated: Boolean (for words, whether they have a ! or - before)
	left: Node
	right: Node
}
*/

var OR__RE = /^\s*[|,]/;
var AND__RE = /^\s*[&+]|^\s+(?=[^\s|,])/; // & or + or a space
var WORD__RE = /^[\s|,&+<:]*([!-])?[\s|,&+<:!-]*([^\s|,&+<:]*)/;

/*
 - s remaining string being parsed
	returns Node
*/

function parseOr(s) {
	var node = parseAnd(s),
		input = node.input,
		m = input.match(OR__RE);

	while (m) {
		var next = parseAnd(input.slice(m[0].length));

		input = next.input;
		m = input.match(OR__RE);
		node = {type: '|', input: input, left: node, right: next};
	}
	return node;
}

function parseAnd(s) {
	var left = parseWord(s),
		input = left.input,
		m = input.match(AND__RE);

	if (!m) return left;

	var right = parseOr(input.slice(m[0].length));
	return {type: '&', input: right.input, left: left, right: right};
}

function parseWord(s) {
	var m = s.match(WORD__RE) || ['', undefined, ''];

	var negated = m[1];
	var value = m[2];

	if (value[0] === '(') {
		var node = parseOr(s.slice(m[0].length - value.length + 1));
		
		var mClose = node.input.match(/^[\s|,&+<:]*(\))?/);

		node.input = node.input.slice(mClose[0].length);
		node.negated = negated;

		return node;
	}

	return {type: 'w', negated: negated, input: s.slice(m[0].length), value: value.replace(/[()!]+/g, '')};
}

function tsquery(q) {
	var node = parseOr(q || '');
	return toStr(node);
}

function toStr(node) {
	var s = node.negated ? '!' : '';
	var type = node.type;
	if (type === 'w') {
		return node.value && (s + node.value); // avoid just '!'
	}

	var leftStr = toStr(node.left);
	var rightStr = toStr(node.right);
	if (!leftStr) {
		return s + rightStr;
	}
	if (!rightStr) {
		return s + leftStr
	}
	if (node.type==='&' && node.left.type==='|') { // wrap left in parens
		leftStr = '(' + leftStr + ')';
	}
	if (node.type==='&' && node.right.type==='|') { // wrap right in parens
		rightStr = '(' + rightStr + ')';
	}
	return s + leftStr + node.type + rightStr;
}
