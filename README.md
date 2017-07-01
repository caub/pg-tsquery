## pg text-search sanitizer

Like `plainto_tsquery` operator but allow OR query, and more later

```js
const tsquery = require('pg-tsquery');

pool.query("SELECT * FROM tabby WHERE to_tsvector(col) @@ to_tsquery($1)", [tsquery(str)])

// tsquery('foo bar') == 'foo&bar'
// tsquery('foo,bar') == 'foo|bar'
// tsquery('foo bar', ':*') == 'foo:*&bar:*'
```