## pg text-search sanitizer

Like `plainto_tsquery` operator but allow an input without letting pg throw 

```js
const tsquery = require('pg-tsquery');

pool.query("SELECT * FROM tabby WHERE to_tsvector(col) @@ to_tsquery($1)", [tsquery(str)])

```

Examples of inputs

- `foo bar`
- `foo -bar` is like `foo !bar`, `foo + !bar` and `foo&!bar` the final form
- `foo bar,bip` is like `foo+bar | bip` and `foo&bar|bip` the final form

Notes:
- `()<:` are ignored
- it's safe to add `:*` at the end of the result of tsquery, if it's not empty, for substring matching 