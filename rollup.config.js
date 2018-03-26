import babel from 'rollup-plugin-babel';

const tweakDefault = {
  transformBundle: source =>
    source.replace(/^exports\.default = (.*);$/m, (_, x) => `module.exports = exports = ${x};`),
};

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
    plugins: [tweakDefault],
  },
];
