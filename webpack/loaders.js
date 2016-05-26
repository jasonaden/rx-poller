module.exports = [
  {
    test: /\.ts(x?)$/, 
    loader: 'babel-loader?presets[]=es2015&presets[]=stage-0!ts-loader', 
    exclude: /(node_modules|typings|webpack)/
  }
];
