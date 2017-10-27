## PostgreSQL text-search sanitizer

[![npm version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![coverage status][codecov-image]][codecov-url]

Like `plainto_tsquery` operator but allows more syntax (OR, NOT) without letting pg throws 

```js
const tsquery = require('pg-tsquery');

pool.query("SELECT * FROM tabby WHERE to_tsvector(col) @@ to_tsquery($1)", [tsquery(str)])

```

Examples of inputs

- `foo bar` is `foo&bar`
- `foo -bar` is like `foo !bar`, `foo + !bar` and `foo&!bar`
- `foo bar,bip` is like `foo+bar | bip` and `foo&bar|bip`
- `foo (bar,bip)` is like `foo+(bar|bip)` and `foo&(bar|bip)`

Notes:
- `<:` are ignored
- it's safe to add `:*` at the end of the result of tsquery, if it's **not empty** and **not ending with )**, for substring matching (we could add an option to add it to the last word seen)


[npm-image]: https://img.shields.io/npm/v/pg-tsquery.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/pg-tsquery
[travis-image]: https://img.shields.io/travis/caub/pg-tsquery.svg?style=flat-square
[travis-url]: https://travis-ci.org/caub/pg-tsquery
[codecov-image]: https://img.shields.io/codecov/c/github/caub/pg-tsquery.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/caub/pg-tsquery