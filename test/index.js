
const tsquery = require('../');
const assert = require('assert');
const {Pool} = require('pg');
const pool = new Pool();


const tests = [
	`foo `,
	`  o | 
hb &,pl`,
	` rgr   |, , ok,,ok+rg*rh*t&jnj&j&&jn\n\nrgr`,
	` ,,,,,, `,
	` ,,,,+&&++ `,
	` ,,,,+|+"+ &!& `,
	` foo,bar  ,\`  lol !,ok, !! -blue `,
	` foo+---bar  ,  lol \`+ok+ blue `,
	` foo& &&!bar - & | '""' & lol +,ok+ blue "" `,
];

// console.log(tests.map(tsquery))


(async () => {

	await pool.query(`select to_tsquery($1)`, ['this crashes']).catch(e => assert(e));

	await pool.query(`select to_tsvector('a quick brown fox') @@ plainto_tsquery($1) as x`, ['quick,fast fox'])
	.then(({rows:[{x}]})=>assert(!x));

	await pool.query(`select to_tsvector('a quick brown fox') @@ to_tsquery($1) as x`, [tsquery('fast  ,, , fox quic')+':*'])
	.then(({rows:[{x}]})=>assert(x));

	// todo add more tests of queries matching with it


	for (const s of tests) {
		const tq = tsquery(s)
		console.log('test', tq);
		await pool.query(`select to_tsquery($1)`, [tq]);
	}

	for (const s of tests) {
		const tq = tsquery(s);
		if (!tq) continue;
		console.log('test', tq);
		await pool.query(`select to_tsquery($1)`, [tq+':*']);
	}


	const tests2 = [].concat(...Array.from({length:1e3}, (_,i)=> ['sea', 'car', 'bike', ...tests].map(x=>`${x} ${i||''}`)));
	console.time('- perf');
	for (const t of tests2) {
		tsquery(t);
	}
	console.timeEnd('- perf');

	console.time('- perf comp');
	for (const t of tests2) {
		t.match(/[^\s()<&!|:]+/g).join('&')
	}
	console.timeEnd('- perf comp');

})()
.then(() => {
	console.log('ok');
})
.catch(e => {
	console.error(e);
	process.exit(e);
});

