/*

parse any string to a valid pg tsquery

*/

module.exports = tsquery;

// todo: should do a proper parser at this point (better for parens)
function tsquery(q) {

	if(!q) {q = ''}
	
	// const q1 = q.replace(/^[\s,()<&+|:]+|\![\s,()<&|:]+|[\s,()<&+|:!]+$|/g, ''); // trim // slower than 2 non global like below
	const q1 = q.replace(/^[\s,<&+|:]+/, '').replace(/[\s,<&+|:!]+$/, '').replace(/\![\s,<&|:]+/g, ''); // trim

	const q2 = q1.replace(/([\s<&+:!]*[|,])+[\s<&+:]*/g, '|'); // process ORs

	const q3 = q2.replace(/[\s<&+:!]*[\s<&+:]+/g, '&'); // process ANDs

	if (q3==='|' || q3==='&') return '';

	const q4 = q3.replace(/(^|[|&])-+(?=\w)/g, '$1!'); // let -word be like !word

	// the only operators are now & | !
	// make sure parens are at the right place, and are balanced
	const q5 = q4.replace(/[^&|!]([()])(?!([&|!()]|$))/g, function(a) { a.replace(/[()]/g, '')});
	const re = /[()]/g;
	let m, balance = 0;
	while (m=re.exec(q5)) {
		balance += m[0]==='(' ? 1 : -1;
	}
	return balance < 0 ? q5.replace(/[()]/g, '') : q5 + ')'.repeat(balance);
}


// console.log(tsquery(' ,,,  '))
// console.log(tsquery(' I like totmatoes yum'));
// console.log(tsquery('(fa(st  ,, , fox) quic')+':*');
