/*

parse any string to a valid pg tsquery

*/

module.exports = tsquery;

function tsquery(q='') {

	// const q1 = q.replace(/^[\s,()<&+|:]+|\![\s,()<&|:]+|[\s,()<&+|:!]+$|/g, ''); // trim // slower than 2 non global like below
	const q1 = q.replace(/^[\s,()<&+|:]+/, '').replace(/[\s,()<&+|:!]+$/, '').replace(/\![\s,()<&|:]+/g, ''); // trim

	const q2 = q1.replace(/([\s()<&+:!]*[|,])+[\s()<&+:]*/g, '|'); // process ORs

	const q3 = q2.replace(/[\s()<&+:!]*[\s()<&+:]+/g, '&'); // process ANDs

	if (q3=='|' || q3=='&') return '';

	return q3.replace(/(^|[|&])-+(?=\w)/g, '$1!'); // let -word be like !word
}


// console.log(tsquery(' ,,,  '))
// console.log(tsquery(' I like totmatoes yum'));
// console.log(tsquery('fast  ,, , fox quic')+':*');