// include gulp
var gulp = require('gulp');

// include plug-ins
var jshint = require('gulp-jshint');
var webpack = require('webpack-stream');

// JS hint task
gulp.task('jshint', function() {
  gulp.src('./src/*.js')
   .pipe(jshint())
   .pipe(jshint.reporter('default'));
});

// JS concat, strip debugging and minify
gulp.task('scripts', function() {
  return gulp.src('src/ccBooleanAnalysis.js', {base: './'})
    .pipe(webpack({
      output: {
        filename: "ccBooleanAnalysis.js",
        library: "ccBooleanAnalysis",
        libraryTarget: "umd"
      }
    }))
    .pipe(gulp.dest('./build/'))
});

// default gulp task
gulp.task('default', function () {
  // watch for JS changes
  gulp.watch('./src/*.js', function() {
    gulp.run('jshint', 'scripts');
  });
});
