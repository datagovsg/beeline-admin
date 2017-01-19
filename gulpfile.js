var gulp = require('gulp');
var gutil = require('gulp-util');
//var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var webpack = require('webpack-stream');
var sourcemaps = require('gulp-sourcemaps');
var fs = require('fs')
var child_process = require('child_process')
var path = require('path')
var request = require('request');

var paths = {
  sass: ['./scss/**/*.scss']
};
function errHandler(err) {
    console.log(err);
    this.emit('end');
}

gulp.task('default', ['sass', 'webpack', 'js-libraries', 'assets']);

gulp.task('js-libraries', function() {
  gulp.src('./node_modules/angular-ui-bootstrap/dist/ui-bootstrap-csp.css')
      .pipe(gulp.dest('./www/css'))
});

gulp.task('assets', function (done) {
  gulp.src(['./node_modules/bootstrap/fonts/*'])
      .pipe(gulp.dest('./www/fonts/bootstrap'))
      .on('end', done)
      .on('error', done);
})

gulp.task('sass', function(done) {
  gulp.src(['./scss/ionic.app.scss'])
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(rename({ basename: 'styles' }))
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename("styles.css"))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});


function webpackPrefix(PREFIX, done) {
  return gulp.src(['beeline-admin/main.js', '!node_modules/**/*.js', '!www/**/*.js'])
    .pipe(sourcemaps.init())
    .pipe(webpack(require('./webpack.config.js'))
        .on('error', done || errHandler))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest((PREFIX || 'www') + '/lib/beeline-admin'))
    .on('error', done || errHandler)
}

gulp.task('webpack', function() {
  process.env.BACKEND_URL = process.env.BACKEND_URL || 'https://beeline-server-dev.herokuapp.com';

  return new Promise((resolve, reject) => {
    request.get(`${process.env.BACKEND_URL}/auth/credentials`, (err, response, body) => {
      if (err) {
        console.log(err);
        return reject(err);
      }

      resolve(JSON.parse(body));
    })
  })
  .then((result) => {
    process.env.AUTH0_CID = result.cid;
    process.env.AUTH0_DOMAIN = result.domain;

    return new Promise((resolve, reject) => {
      webpackPrefix(null).on('end', resolve);
    });
  })
});

gulp.task('watch', ['sass', 'webpack', 'js-libraries'], function() {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(['beeline-admin/**/*.js', 'beeline-admin/**/*.html', 'scss/*.scss'], ['webpack']);
});

/*** To deploy the app to Github pages ***/

function promiseExec(cmd, options) {
  return new Promise((resolve, reject) => {
    child_process.exec(cmd, options || {}, (err, stdout, stderr) => {
      console.log(stdout);
      console.log(stderr);

      return err ? reject(err) : resolve();
    })
  })
}

gulp.task('deploy-prepare-git', function (done) {
  // Ensure that build/ is a git repo
  new Promise((resolve, reject) => {
    fs.mkdir(path.resolve('build'), (err) => err ? resolve() : reject(err))
  })
  // Pull the latest (avoid conflicts)
  .then(() => {
    fs.writeFileSync(path.resolve('build') + '/CNAME', 'admin.beeline.sg')
  })
  .then(done, errHandler);
});

gulp.task('deploy-copy', ['deploy-prepare-git', 'sass', 'js-libraries'], function (done) {
  return gulp.src('./www/**/*')
    .pipe(gulp.dest('build'))
})

gulp.task('deploy-build', ['deploy-copy'], function (done) {
  process.env.BACKEND_URL='https://api.beeline.sg'
  process.env.AUTH0_CID='BslsfnrdKMedsmr9GYkTv7ejJPReMgcE'
  process.env.AUTH0_DOMAIN='beeline.au.auth0.com'

  return webpackPrefix('build', done)
})

gulp.task('deploy', ['deploy-build'], function (done) {
  done();
})

gulp.task('deploy!', ['deploy'], function (done) {
  fs.writeFileSync(path.resolve('.tmp-commit-message'),
                    'Deploy on ' + new Date().toISOString() + ' by ')

  var ghPages = require('gh-pages')
  
  return new Promise((resolve, reject) =>
	ghPages.publish(path.join(__dirname, 'build'), (err) => {
	  if (err) reject(err)
	  else resolve()
	})
  )
});
