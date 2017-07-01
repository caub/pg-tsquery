/*

parse any string to a valid pg tsquery

special chars: ()<&!|:\s

return a query with & and | (from ',') for the moment
possibly ! soon, or parenthesis with a descent parser

*/

const re = /[^\s,()<&!|:]+/g;

module.exports = tsquery;

function tsquery(_q='', wildcard='') {
	const q = _q.trim(), a = [];
	let m, s='', i=0;
	while(m=re.exec(q)) {
		const x = m[0];
		a.push(m.index, m.index+x.length);
	}
	for (; i<a.length-2; i+=2) {
		const start = a[i], end = a[i+1];
		s += q.slice(start, end) + wildcard + (q[end+1]==','?'|':'&');
	}
	s += q.slice(a[i], a[i+1]);
	return s && s + wildcard;
}


// console.log(tsquery(' ,,,  ', ':*'))