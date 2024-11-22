const esbuild = require('esbuild')


const commonConfig = {
  entryPoints: ['./src/index.ts'],
  bundle: true,
  minify: false,
  target: 'esnext',
  external: ['react', 'react-redux'],
  target: ['es2022'],
  sourcemap: true,
  loader: {
    '.ts': 'ts',
  },
}

esbuild
  .build({
    ...commonConfig,
    format: 'esm',
    outfile: 'dist/index.esm.js'
  })
  .catch(() => process.exit(1))

esbuild
  .build({
    ...commonConfig,
    format: 'cjs',
    outfile: 'dist/index.cjs.js'
  })
  .catch(() => process.exit(1))