module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript'
  ],
  plugins: [
    [
      'babel-plugin-module-resolver',
      {
        root: ['./src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        alias: {
          '@components': './src/components',
          '@contexts': './src/contexts',
          '@services': './src/services',
          '@utils': './src/utils',
          '@pages': './src/pages',
          '@firebase': './src/firebase'
        }
      }
    ]
  ]
}; 