/*

parse any string to a valid pg tsquery

*/

module.exports = tsquery;

// const TRIM_RE = /^[\s,()<&|:]+|[\s,()<&|:!]+$/g; // slower than below

// use that when it's stable
// const TRIM_START_RE = /^[\s,()<&|:]+/;
// const TRIM_END_RE = /[\s,()<&|:!]+$/;
// const OR_RE = /([\s()<&+:!]*[|,])+[\s()<&+:]*/g;
// const AND_RE = /[\s()<&+:!]*[\s()<&+:]+/g;
// const NOT_RE = /(^|[|&])-+(?=\w)/g;


function tsquery(q='') {

	const q1 = q.replace(/^[\s,()<&+|:]+/, '').replace(/[\s,()<&+|:!]+$/, '').replace(/\![\s,()<&|:]+/g, ''); // trim

	const q2 = q1.replace(/([\s()<&+:!]*[|,])+[\s()<&+:]*/g, '|'); // process ORs

	const q3 = q2.replace(/[\s()<&+:!]*[\s()<&+:]+/g, '&'); // process ANDs

	if (q3=='|' || q3=='&') return '';

	return q3.replace(/(^|[|&])-+(?=\w)/g, '$1!'); // let -word be like !word
}


// console.log(tsquery(' ,,,  '))
// console.log(tsquery(' I like totmatoes yum', ':*'));
// console.log(tsquery('fast  ,, , fox quic')+':*');