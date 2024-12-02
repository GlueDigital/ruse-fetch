module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        }
      }
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
        development: process.env.BABEL_ENV !== 'production'
      }
    ],
    '@babel/preset-typescript'
  ],
  plugins: ['@babel/plugin-transform-runtime']
}
