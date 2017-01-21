// include gulp
var gulp = require('gulp'),
    babel = require('gulp-babel'),
    webpack = require('webpack-stream');

// include plug-ins
var jshint = require('gulp-jshint');


// JS hint task
gulp.task('jshint', function() {
  gulp.src('./src/*.js')
   .pipe(jshint())
   .pipe(jshint.reporter('default'));
});

// JS concat, strip debugging and minify
gulp.task('scripts', function() {
    return gulp.src('src/ccBooleanAnalysis.js')
  .pipe(webpack({
  entry: './src/ccBooleanAnalysis.js',
  output: {
    filename: 'ccBooleanAnalysis.js',
    library: 'ccBooleanAnalysis',
    libraryTarget: "umd"
  },
  
  //debug:true,
  module:{
  loaders: [
    {
      exclude: /(node_modules|bower_components)/,
      query: {
        presets: ['es2015']
      },
      loader: 'babel' // 'babel-loader' is also a legal name to reference
    }
  ]
  }
  
  }))
  .pipe(gulp.dest('build/'));
});

// default gulp task
gulp.task('default', function () {
  // watch for JS changes
  gulp.watch('./src/*.js', function() {
    gulp.run('jshint', 'scripts');
  });
});



