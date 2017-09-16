/*

parse any string to a valid pg tsquery

*/

module.exports = tsquery;
tsquery.tsquery = tsquery;
tsquery.parse = parse;
tsquery.toStr = toStr;


/*
OrAnd ::= OrAnd (/[\s|,&+]/ OrAnd)*  // precedence doesn't matter here, it's managed by pg's parser
Word ::= /[!-]/ (/[^\s()<&|:]+/ | '(' Or ')')
*/

/*

Node: {
	input: String // remaining input string to parse
	value: String // matched value in input
	type: Enum ('|', '&', 'w', '(')
	negated: Boolean (for words, whether they have a ! or - before)
	left: Node
	right: Node
}
*/

var OR_AND__RE = /^\s*([|,])*([&+])*/;
var WORD__RE = /^[\s,<&+|:]*([!-])?[\s,<&+|:!-]*([^\s,<&+|:-]*)/;

/*
 - s remaining string being parsed
	returns Node
*/
function parse(s) {
	var node = parseWord(s),
		input = node.input,
		m = input.match(OR_AND__RE);

	while (m[0]) {
		var type = m[1] ? '|' : '&',
			next = parseWord(input.slice(m[0].length));
		input = next.input;
		m = input.match(OR_AND__RE);
		node = {type: type, input: input, left: node, right: next};
	}

	return node;
}


function parseWord(s) {
	var m = s.match(WORD__RE);

	var negated = m[1];
	var value = m[2];

	if (value[0] === '(') {
		var left = parse(s.slice(m[0].length - value.length + 1)); // like value.slice(1) but capture all remaining string
		
		var mClose = left.input.match(/^[\s,<&+|:]*(\))?/);

		return {type: '(', negated: negated, input: left.input.slice(mClose[0].length), left: left};
	}

	return {type: 'w', negated: negated, input: s.slice(m[0].length), value: value.replace(/[()!]+/g, '')};
}

function tsquery(q) {
	var node = parse(q || '');
	return toStr(node);
}

function toStr(node) {
	var s = node.negated ? '!' : '';
	var type = node.type;
	if (type === 'w') {
		return node.value && (s + node.value); // avoid just '!'
	}
	if (type === '(') {
		return s + '(' + toStr(node.left) + ')';
	}
	var leftStr = toStr(node.left);
	var rightStr = toStr(node.right);
	if (!leftStr) {
		return s + rightStr;
	}
	if (!rightStr) {
		return s + leftStr
	}
	return s + leftStr + node.type + rightStr;
}

// console.log(tsquery(' ,,,  '))
// console.log(tsquery(' I like totmatoes yum'));
// console.log(tsquery('(fa(st  ,, , fox) quic'));
// console.log(tsquery(`!he!llo`));
// console.log(tsquery(`  (h(e((ll))o, (nas(ty)), (world\t\t `))
