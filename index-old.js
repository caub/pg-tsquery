// old way, with regexes, kept for perf comparison
module.exports = function tsqueryOld(q) {
	q = q || '';

	var q1 = q.replace(/^[\s,<&+|:]+/, '').replace(/[\s,<&+|:!]+$/, '').replace(/\![\s,<&|:]+/g, ''); // trim

	var q2 = q1.replace(/([\s<&+:!]*[|,])+[\s<&+:]*/g, '|'); // process ORs

	var q3 = q2.replace(/[\s<&+:!]*[\s<&+:]+/g, '&'); // process ANDs

	if (q3==='|' || q3==='&') return '';

	var q4 = q3.replace(/(^|[|&])-+(?=\w)/g, '$1!'); // let -word be like !word

	// the only operators are now & | !
	// make sure parens are at the right place, and are balanced
	var q5 = q4.replace(/[^&|!]([()])(?!([&|!()]|$))/g, function (a) {
		return a.replace(/[()]/g, '');
	});
	var re = /[()]/g;
	var m, balance = 0;
	while (m=re.exec(q5)) {
		balance += m[0]==='(' ? 1 : -1;
	}
	return balance < 0 ? q5.replace(/[()]/g, '') : q5 + ')'.repeat(balance);
}
