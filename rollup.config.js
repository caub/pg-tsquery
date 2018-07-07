import babel from 'rollup-plugin-babel';

// rollup generate exports.default = .., exports.parse = .., let's add tsquery as default module.exports
const tweakDefault = {
  transformBundle: source => {
    const defaultExport = source.match(/^exports\.default = (\w+);$/m);
    // supposing exports.default comes first
    return `${source.slice(0, defaultExport.index)}
module.exports = ${defaultExport[1]};
${source.slice(defaultExport.index).replace(/^exports\./gm, 'module.exports.')}`;
  }
};

export default [
  {
    input: 'index.mjs',
    output: {
      file: 'dist/tsquery.js',
      format: 'cjs',
      exports: 'named',
    },
    plugins: [tweakDefault],
  },
  {
    input: 'index.mjs',
    output: {
      file: 'dist/tsquery.umd.js',
      format: 'umd',
      name: 'tsquery',
      exports: 'named',
    },
    plugins: [babel()],
  },
];
