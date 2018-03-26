import babel from 'rollup-plugin-babel';

const tweakDefault = () => ({
  transformBundle: function(source) {
    var lines = source.split('\n');
    for (var i = lines.length - 10; i < lines.length; i++) {
      var line = lines[i];

      var matches = line.match(/^exports\.default = (.*);$/);
      if (matches) {
        lines[i] = 'module.exports = exports = ' + matches[1] + ';';
        break;
      }
    }
    return lines.join('\n');
  },
});

export default [
  {
    input: 'index.js',
    output: {
      file: 'umd/tsquery.js',
      format: 'umd',
      name: 'tsquery',
      exports: 'named',
    },
    plugins: [babel()],
  },
  {
    input: 'index.js',
    output: {
      file: 'cjs/tsquery.js',
      format: 'cjs',
      exports: 'named',
    },
    plugins: [tweakDefault()],
  },
];
