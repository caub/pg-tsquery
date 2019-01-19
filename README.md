# Text-Search parser for PostgreSQL

[![npm version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![coverage status][codecov-image]][codecov-url]

### Why?

Using pg's `to_tsquery` with user input can throw  
There's `plainto_tsquery` but it's very limited (it just puts an AND between words)

This module allows to parse various user input operators:
- AND: `&` `+` `and` `\s+`
- FOLLOWED_BY: `<>` `<->` `<\d+>`
- OR: `,` `|` `or`
- NOT: `!` `-`
- SUBSTRING: `:*`
- parentheses: `()[]`

### Usage
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
| `foo<bar<->bip<2>sun` | `foo<->bar<->bip<2>sun` |
| `foo*,bar* bana:*` | `foo:*\|bar:*&bana:*` |


### [Demo](https://caub.github.io/pg-tsquery)

Supports Nodejs>=9, for lower versions, you might need `if (!String.prototype.trimStart) String.prototype.trimStart = String.prototype.trim;`

[npm-image]: https://img.shields.io/npm/v/pg-tsquery.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/pg-tsquery
[travis-image]: https://img.shields.io/travis/caub/pg-tsquery.svg?style=flat-square
[travis-url]: https://travis-ci.org/caub/pg-tsquery
[codecov-image]: https://img.shields.io/codecov/c/github/caub/pg-tsquery.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/caub/pg-tsquery
