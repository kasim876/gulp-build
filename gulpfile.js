const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const del = require('del');
const fileinclude = require('gulp-file-include');
const htmlbeautify = require('gulp-html-beautify');
const htmlmin = require('gulp-htmlmin');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const svgSprite = require('gulp-svg-sprite');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');
const gulpif = require('gulp-if');

const srcFolder = "./src"
const buildFolder = "./app"
const paths = {
  srcStyles: `${srcFolder}/scss/**/*.scss`,
  buldStyles: `${buildFolder}/css/`,
  srcScripts: `${srcFolder}/js`,
  buildScripts: `${buildFolder}/js/`,
  srcImages: `${srcFolder}/img/**.*`,
  buildImages: `${buildFolder}/img`,
  srcSvg: `${srcFolder}/img/svg/**.svg`,
  resourcesFolder: `${srcFolder}/resources/**`,
}

let isProd = false;

const clean = () => {
  return del([buildFolder]);
}

const html = () => {
  return gulp.src(`${srcFolder}/*.html`)
    .pipe(fileinclude({
      prefix: '@',
      basepath: '@file',
    }))
    .pipe(gulpif(!isProd, htmlbeautify({
      "indent_size": 2,
    })))
    .pipe(gulpif(isProd, htmlmin({
      collapseWhitespace: true,
    })))
    .pipe(gulp.dest(`${buildFolder}`))
    .pipe(browserSync.stream());
}

const styles = () => {
  return gulp.src(paths.srcStyles)
    .pipe( sass() )
    .pipe(autoprefixer({
      cascade: false,
      grid: true,
      overrideBrowserslist: ["last 5 versions"]
    }))
    .pipe(gulpif(isProd, cleanCSS({
      level: 2
    })))
    .pipe( gulp.dest(paths.buldStyles) )
    .pipe(browserSync.stream());
}

const scripts = () => {
  gulp.src(`${paths.srcScripts}/vendors/*.js`)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(paths.buildScripts))
  return gulp.src([`${paths.srcScripts}/components/*.js`])
    .pipe(concat('main.js'))
    .pipe(gulp.dest(paths.buildScripts))
    .pipe(browserSync.stream());
}

const images = () => {
  return gulp.src(paths.srcImages)
    .pipe(gulp.dest(paths.buildImages))
    .pipe(browserSync.stream());
};

const svgSprites = () => {
  return gulp.src(paths.srcSvg)
    .pipe(
      svgmin({
        js2svg: {
          pretty: true,
        },
      })
    )
    .pipe(
      cheerio({
        run: function ($) {
          $('[fill]').removeAttr('fill');
          $('[stroke]').removeAttr('stroke');
          $('[style]').removeAttr('style');
        },
        parserOptions: {
          xmlMode: true
        },
      })
    )
    .pipe(replace('&gt;', '>'))
    .pipe(svgSprite({
      mode: {
        stack: {
          sprite: "../sprite.svg"
        }
      },
    }))
    .pipe(gulp.dest(paths.buildImages));
}

const resources = () => {
  return gulp.src(paths.resourcesFolder)
    .pipe(gulp.dest(buildFolder))
    .pipe(browserSync.stream());
}

const toProd = (done) => {
  isProd = true;
  done();
};

const watchFiles = () => {
  browserSync.init({
    server: {
      baseDir: `${buildFolder}`,
    },
  });

  gulp.watch(`${srcFolder}/**/*.html`, html);
  gulp.watch(paths.srcStyles, styles);
  gulp.watch(paths.srcScripts, scripts);
  gulp.watch(paths.srcImages, images);
  gulp.watch(paths.srcSvg, svgSprites);
  gulp.watch(paths.resourcesFolder, resources);
}

exports.default = gulp.series(clean, html, styles, scripts, images, svgSprites, resources, watchFiles);
exports.build = gulp.series(toProd, clean, html, styles, images, svgSprites, resources, scripts)