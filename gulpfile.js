const { src, dest, parallel, series, watch } = require('gulp');
const sass = require('gulp-sass');
const notify = require('gulp-notify');
const rename = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const htmlmin = require('gulp-htmlmin');
const browserSync = require('browser-sync').create();
const fileinclude = require('gulp-file-include');
const svgSprite = require('gulp-svg-sprite');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fs = require('fs');
const del = require('del');
const uglify = require('gulp-uglify-es').default;
const tiny = require('gulp-tinypng-compress');
const gutil = require('gulp-util');
const ftp = require('vinyl-ftp');
const concat = require('gulp-concat');

const fonts = () => {
  src('./src/fonts/**.ttf')
    .pipe(ttf2woff())
    .pipe(dest('./app/fonts/'))
  return src('./src/fonts/**.ttf')
    .pipe(ttf2woff2())
    .pipe(dest('./app/fonts/'))
}

const svgSprites = () => {
  return src('./src/img/svg-sprite/**.svg')
    .pipe(svgSprite({
      mode: {
        stack: {
          sprite: "../sprite.svg"
        }
      }
    }))
    .pipe(dest('./app/img'))
}

const styles = () => {
  return src('./src/scss/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', notify.onError()))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(autoprefixer({
      cascade: false,
    }))
    .pipe(cleanCSS({
      level: 2
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('./app/css/'))
    .pipe(browserSync.stream());
}

const htmlinclude = () => {
  return src(['./src/**/*.html', '!./src/components/*.html', '!./src/components/**/*.html'])
    .pipe(fileinclude({
      prefix: '@',
      basepath: '@file'
    }))
    .pipe(dest('./app'))
    .pipe(browserSync.stream());
}

const imgToApp = () => {
  return src([
    './src/img/**.jpg',
    './src/img/**.png',
    './src/img/**.jpeg',
    './src/img/**.gif',
    './src/img/**/*.svg', '!./src/img/svg-sprite/*.svg',
    './src/img/**/*.jpg',
    './src/img/**/*.png',
    './src/img/**/*.gif',
    './src/img/**/*.jpeg'
  ])
    .pipe(dest('./app/img'))
}

const resources = () => {
  return src('./src/resources/**')
    .pipe(dest('./app'))
}

const clean = () => {
  return del(['app/*'])
}

const scripts = () => {
  return src([
    'node_modules/jquery/dist/jquery.js',
    'node_modules/swiper/swiper-bundle.js',
    'node_modules/mixitup/dist/mixitup.js',
    './src/js/main.js'
  ])
    .pipe(concat('main.js'))
    .pipe(sourcemaps.init())
    .pipe(uglify().on("error", notify.onError()))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('./app/js'))
    .pipe(browserSync.stream());
}

const watchFiles = () => {
  browserSync.init({
    server: {
      baseDir: "./app"
    }
  });

  watch('./src/scss/**/*.scss', styles);
  watch('./src/**/*.html', htmlinclude);
  watch('./src/img/**.jpg', imgToApp);
  watch('./src/img/**.png', imgToApp);
  watch('./src/img/**.gif', imgToApp);
  watch('./src/img/**.jpeg', imgToApp);
  watch('./src/img/**.svg', imgToApp);
  watch('./src/img/**/**.jpg', imgToApp);
  watch('./src/img/**/**.png', imgToApp);
  watch('./src/img/**/**.gif', imgToApp);
  watch('./src/img/**/**.jpeg', imgToApp);
  watch('./src/img/icon/**.svg', imgToApp);
  watch('./src/img/content/**.svg', imgToApp);
  watch('./src/img/svg/**.svg', imgToApp);
  watch('./src/img/svg-sprite/**.svg', svgSprites);
  watch('./src/resources/**', resources);
  watch('./src/fonts/**.ttf', fonts);
  watch('./src/js/**/*.js', scripts);
}

exports.styles = styles;
exports.watchFiles = watchFiles;
exports.fileinclude = htmlinclude

exports.default = series(clean, parallel(htmlinclude, scripts, fonts, resources, imgToApp, svgSprites), styles, watchFiles);


const tinypng = () => {
  return src([
    './src/img/**.jpg',
    './src/img/**.png',
    './src/img/**.gif',
    './src/img/**.jpeg',
    './src/img/**/**.jpg',
    './src/img/**/**.png',
    './src/img/**/**.gif',
    './src/img/**/**.jpeg'
  ])
    .pipe(tiny({
      key: '349QgHyGtVSJVh70mSYlstJfbqHqgmls',
      log: true,
      parallel: true,
      parallelMax: 50,
      log: true,
    }))
    .pipe(dest('./app/img'))
}

const htmlMinify = () => {
  return src('app/**/*.html')
    .pipe(htmlmin({
      collapseWhitespace: true
    }))
    .pipe(dest('app'));
}

const stylesBuild = () => {
  return src('./src/scss/**/*.scss')
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', notify.onError()))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(autoprefixer({
      cascade: false,
    }))
    .pipe(cleanCSS({
      level: 2
    }))
    .pipe(dest('./app/css/'))
}

const scriptsBuild = () => {
  return src([
    'node_modules/jquery/dist/jquery.js',
    'node_modules/swiper/swiper-bundle.js',
    'node_modules/mixitup/dist/mixitup.js',
    './src/js/main.js'
  ])
    .pipe(concat('main.js'))
    .pipe(uglify().on("error", notify.onError()))
    .pipe(dest('./app/js'))
}

exports.build = series(clean, parallel(htmlinclude, htmlMinify, scriptsBuild, fonts, resources, imgToApp, svgSprites), stylesBuild, tinypng);


// deploy
const deploy = () => {
  let conn = ftp.create({
    host: '',
    user: '',
    password: '',
    parallel: 10,
    log: gutil.log
  });

  let globs = [
    'app/**',
  ];

  return src(globs, {
    base: './app',
    buffer: false
  })
    .pipe(conn.newer('')) // only upload newer files
    .pipe(conn.dest(''));
}

exports.deploy = deploy;