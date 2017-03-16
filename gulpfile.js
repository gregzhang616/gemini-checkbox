/**
 * Created by Greg Zhang on 2017/1/14.
 */
var gulp = require('gulp'),
    gulpUglify = require('gulp-uglify'),
    $dev = require('gulp-load-plugins'),
    srcBasePath = 'src/',
    srcAssetsPath = srcBasePath + 'assets/',
    srcI18nPath = srcBasePath + 'i18n/',
    distBasePath = 'dist/',
    distAssetsPath = distBasePath + 'assets/',
    distI18nPath = distBasePath + 'i18n/',
    srcSassPath = srcBasePath + 'scss/',
    componentSassList = [
      srcBasePath + 'fonts/*.css',
      srcSassPath + 'checkbox.scss'
    ];

gulp.task('copy-html', function () {
  return gulp.src(srcBasePath + '**/*.html')
    .pipe(gulp.dest(distBasePath))
    .pipe($dev().connect.reload());
});

gulp.task('copy-assets', function () {
  return gulp.src(srcAssetsPath + '**/*.{js,css,jpg,png,ico}')
    .pipe(gulp.dest(distAssetsPath))
    .pipe($dev().connect.reload());
});

gulp.task('process-fonts', function () {
  return gulp.src(srcBasePath + 'fonts/*.{eot,svg,ttf,woff}')
    .pipe(gulp.dest(distBasePath + 'fonts'));
});

gulp.task('process-component-sass', function () {
  return gulp.src(componentSassList)
    .pipe($dev().sass())
    .pipe($dev().autoprefixer({
      browsers: ["last 2 versions", "Firefox >= 20"]
    }))
    .pipe($dev().concat('gemini.checkbox.css'))
    .pipe(gulp.dest(distBasePath + 'css'))
    .pipe($dev().minifyCss())
    .pipe($dev().rename('gemini.checkbox.min.css'))
    .pipe(gulp.dest(distBasePath + 'css'))
    .pipe($dev().connect.reload());
});

gulp.task('process-component-js', function () {
  return gulp.src(srcBasePath + 'js/*.js')
    .pipe($dev().concat('gemini.checkbox.js'))
    .pipe(gulp.dest(distBasePath + 'js/'))
    .pipe(gulpUglify())
    .pipe($dev().rename('gemini.checkbox.min.js'))
    .pipe(gulp.dest(distBasePath + 'js'))
    .pipe($dev().connect.reload());
});

gulp.task('process-i18n-js', function () {
  return gulp.src(srcI18nPath + '*.js')
    .pipe(gulp.dest(distI18nPath))
    .pipe($dev().connect.reload());
});

gulp.task('server', function () {
  $dev().connect.server({
    root: distBasePath,
    port: 8888,
    livereload: true
  });
});

// Watch task.
gulp.task('watch', function () {
  gulp.watch(srcBasePath + '**/*.html', ['copy-html']);
  gulp.watch(componentSassList, ['process-component-sass']);
  gulp.watch(srcBasePath + 'js/*.js', ['process-component-js']);
  gulp.watch(srcI18nPath + '*.js', ['process-i18n-js']);
  gulp.watch(srcAssetsPath + '**/*.{js,css}', ['copy-assets']);
});

gulp.task('default', ['copy-html', 'copy-assets',
  'process-component-sass', 'process-component-js', 'process-i18n-js', 'process-fonts',
  'server', 'watch']);
