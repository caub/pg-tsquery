# Text-Search parser for PostgreSQL

[![npm version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![coverage status][codecov-image]][codecov-url]

### Why?

Using pg's `to_tsquery` directly with user input can throw errors. `plainto_tsquery` sanitizes the user input, but it's very limited (it just puts an and between words), `websearch_to_tsquery` extends this behavior a little further only between double-quotes, with followedBy operator and negations.

This module allows customizable text-search operators: and, or, followedBy, not, prefix, parentheses, quoted text (same behavior than `websearch_to_tsquery`).

See the [options defaults values](index.js#L52-L61)

### usage
```js
const tsquery = require('pg-tsquery')(/* options can be passed to override the defaults */);

pool.query('SELECT * FROM tabby WHERE to_tsvector(col) @@ to_tsquery($1)', [tsquery(str)]);

// or get a reusable instance
const {Tsquery} = require('pg-tsquery');

const parser = new Tsquery(/* options can be passed to override the defaults */);

// then process your input with parser.parse(str).toString()
```


| inputs | output |
| --- | --- |
| `foo bar` | `foo&bar` |
| `foo -bar`, `foo !bar`, `foo + !bar` | `foo&!bar` |
| `foo bar,bip`, `foo+bar \| bip` | `foo&bar\|bip` |
| `foo (bar,bip)`, `foo+(bar\|bip)` | `foo&(bar\|bip)` |
| `foo>bar>bip` | `foo<->bar<->bip` |
| `foo*,bar* bana:*` | `foo:*\|bar:*&bana:*` |


### [Demo](https://caub.github.io/pg-tsquery)

[npm-image]: https://img.shields.io/npm/v/pg-tsquery.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/pg-tsquery
[travis-image]: https://img.shields.io/travis/caub/pg-tsquery.svg?style=flat-square
[travis-url]: https://travis-ci.org/caub/pg-tsquery
[codecov-image]: https://img.shields.io/codecov/c/github/caub/pg-tsquery.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/caub/pg-tsquery

### Support

Please consider reporting issues and trying to create a pull request as well
