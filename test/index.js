const assert = require('assert');
const { Tsquery } = require('../index');
const pg = require('pg');
const data = require('./data/default.json');
const dataSimple = require('./data/simple.json');

const pool = new pg.Pool({ connectionString: 'pg://postgres@localhost:5432/postgres' });

const tsquery = new Tsquery(); // use default config
const tsquerySimple = new Tsquery({
  or: /^\s*[|,]/,
  and: /^(?!\s*[|,])[\s&:|,!]*/,
  followedBy: /^\s*>/,
  word: /^[\s*&<:,|]*(?<negated>[\s!]*)[\s*&<:,|]*(?<word>[^\s,|&<:*()!]+)/,
  parStart: /^\s*!*[(]/,
  parEnd: /^[)]/,
  negated: /!$/,
  prefix: /^(\*|:\*)*/,
  tailOp: '&',
});

async function test(tsquery, data) {
  for (const [q, expected] of data) {
    assert.strictEqual(`${tsquery.parse(q) || ''}`, expected, `for: ${q}`);
  }
  // test against pg's to_tsquery, it should not throw thanks to this module
  await pool.query(`select to_tsquery($1)`, ['this crashes']).catch(e => assert(e));

  await pool
    .query(`select to_tsvector('a quick brown fox') @@ plainto_tsquery($1) as x`, ['quick,fast fox'])
    .then(({ rows: [{ x }] }) => assert(!x));

  await pool
    .query(`select to_tsvector('a quick brown fox') @@ to_tsquery($1) as x`, [
      tsquery.parse('fast  ,, , fox quic') + ':*',
    ])
    .then(({ rows: [{ x }] }) => {
      assert(x);
    });

  // todo add more tests of queries matching with it

  for (const [s] of data) {
    const tq = `${tsquery.parse(s) || ''}`;
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
    `${tsquery.parse(t)}`;
  }
  console.timeEnd('- perf tsquery');
}

(async () => {
  try {
    await test(tsquery, data);
    console.log('default dataset OK');

    await test(tsquerySimple, dataSimple);
    console.log('simple dataset OK');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
