const data = require('./data.json');
const tsquery = require('..');
const assert = require('assert');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'pg:///postgres' });

data.forEach(([q, expected]) => {
  assert.equal(tsquery(q), expected);
});

(async () => {
  // test against pg's to_tsquery, it should not throw thanks to this module
  await pool.query(`select to_tsquery($1)`, ['this crashes']).catch(e => assert(e));

  await pool
    .query(`select to_tsvector('a quick brown fox') @@ plainto_tsquery($1) as x`, ['quick,fast fox'])
    .then(({ rows: [{ x }] }) => assert(!x));

  await pool
    .query(`select to_tsvector('a quick brown fox') @@ to_tsquery($1) as x`, [
      tsquery('fast  ,, , fox quic') + ':*',
    ])
    .then(({ rows: [{ x }] }) => assert(x));

  // todo add more tests of queries matching with it

  for (const [s] of data) {
    const tq = tsquery(s);
    await pool.query(`select to_tsquery($1)`, [tq]);
  }

  // quick perf test
  const tests = [].concat(...Array.from({ length: 1e3 }, (_, i) => data.map(a => `${a[0]} ${i || ''}`)));

  console.time('- perf basic');
  for (const t of tests) {
    t.match(/[^\s()<&!|:]+/g).join('&');
  }
  console.timeEnd('- perf basic');

  console.time('- perf tsquery');
  for (const t of tests) {
    tsquery(t);
  }
  console.timeEnd('- perf tsquery');
})()
  .then(() => {
    console.log('✅ ok');
    process.exit();
  })
  .catch(e => {
    console.error(e);
    process.exit(e);
  });
