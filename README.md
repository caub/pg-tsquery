## pg text-search sanitizer [![Build Status](https://travis-ci.org/caub/pg-tsquery.svg?branch=master)](https://travis-ci.org/caub/pg-tsquery)

Like `plainto_tsquery` operator but allows more syntax (OR, NOT) without letting pg throws 

```js
const tsquery = require('pg-tsquery');

pool.query("SELECT * FROM tabby WHERE to_tsvector(col) @@ to_tsquery($1)", [tsquery(str)])

```

Examples of inputs

- `foo bar` is `foo&bar`
- `foo -bar` is like `foo !bar`, `foo + !bar` and `foo&!bar`
- `foo bar,bip` is like `foo+bar | bip` and `foo&bar|bip`

Notes:
- `()<:` are ignored
- it's safe to add `:*` at the end of the result of tsquery, if it's not empty, for substring matching 