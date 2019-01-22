const assert = require('assert');
const Tsquery = require('../index')
const pg = require('pg');
const data = require('./data-default.json');
const data2 = require('./data-simple.json');

const pool = new pg.Pool({ connectionString: 'pg://postgres@localhost:5432/postgres' });

const tsquery = Tsquery(); // use default config
const tsquery2 = Tsquery({
  OR: /^\s*[|,]/,
  AND: /^(?!\s*[|,])[\s&:|,!]*/,
  FOLLOWED_BY: /^\s*<(?:(?:(\d+)|-)?>)?/,
  WORD: /^[\s*&<:,|]*([\s!]*)[\s*&<:,|]*([^\s,|&<:*()!]+)/,
  PAR_START: /^\s*!*[(]/,
  PAR_END: /^[)]/,
  NEGATED: /!$/,
  PREFIX: /^(\*|:\*)*/,
  TAIL_OP: '&',
});

test('default', tsquery, data);
test('simple', tsquery2, data2);

async function test(name, tsquery, data) {
  try {
    for (const [q, expected] of data) {
      assert.equal(tsquery(q), expected);
    }

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

    console.log('✔️  ', name);

  } catch (e) {
    console.error(name, e);
  }
}

