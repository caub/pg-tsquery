# PostgreSQL text-search sanitizer

[![npm version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![coverage status][codecov-image]][codecov-url]

### Why?

Using pg's `to_tsquery` with user input can throw  
There's `plainto_tsquery` but it's very limited (it just puts an AND between words)

This module allows to parse user input operators (AND `\s&+`, OR `,|`, NOT `!-` and parentheses `()[]`) without letting pg throws

```js
const tsquery = require('pg-tsquery');

pool.query('SELECT * FROM tabby WHERE to_tsvector(col) @@ to_tsquery($1)', [tsquery(str)])
```

| inputs | output |
| --- | --- |
| `foo bar` | `foo&bar` |
| `foo -bar`, `foo !bar`, `foo + !bar` | `foo&!bar` |
| `foo bar,bip`, `foo+bar \| bip` | `foo&bar\|bip` |
| `foo (bar,bip)`, `foo+(bar\|bip)` | `foo&(bar\|bip)` |

Notes:
- `<:` are ignored, and act like word separators, so an AND
- it's safe to add `:*` at the end of the result of tsquery (for substring matching), if it's **not empty** and **not ending with )** (we could add an option to add it to the last word seen)

[npm-image]: https://img.shields.io/npm/v/pg-tsquery.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/pg-tsquery
[travis-image]: https://img.shields.io/travis/caub/pg-tsquery.svg?style=flat-square
[travis-url]: https://travis-ci.org/caub/pg-tsquery
[codecov-image]: https://img.shields.io/codecov/c/github/caub/pg-tsquery.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/caub/pg-tsquery
