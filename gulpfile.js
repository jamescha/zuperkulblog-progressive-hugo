/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

'use strict';

var gulp = require('gulp');
var useref = require('gulp-useref');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var del = require('del');
var vulcanize = require('gulp-vulcanize');
var crisper = require('gulp-crisper');
var merge = require('merge-stream');
var glob = require('glob');
var crypto = require('crypto');
var rename = require('gulp-rename');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var packageJson = require('./package.json');

gulp.task('clean', function() {
  return del(['dist']);
});

gulp.task('shuffle', ['hugo'], function() {

  // We'd want to keep the sitemap
  gulp.src('app/static/data/sitemap.xml')
    .pipe(rename('app/static/sitemap.xml'))
    .pipe(gulp.dest('./'));
  del(['app/static/data/sitemap.xml']);

  // TODO sort RSS XML

  // Shuffle the html to JSON before copy to dist
  gulp.src('app/static/data/**/*.html')
  .pipe(rename(function(path) {
    path.extname = '.json';
    return path;
  }))
  .pipe(gulp.dest('./app/static/data/'));

});

gulp.task('copy', ['shuffle', 'clean'], function() {
  var app = gulp.src([
      'app/static/**/*',
      '!app/static/data/**/*.{html,xml}',
      '!app/static/index.html',
      '!app/static/scripts/**/*',
      '!app/static/elements/**/*',
      '!app/static/bower_components/**/*'
    ])
    .pipe(gulp.dest('dist/static'));

  var bower = gulp.src([
    'app/static/bower_components/{webcomponentsjs,platinum-sw,sw-toolbox,promise-polyfill}/**/*'
  ])
  .pipe(gulp.dest('dist/static/bower_components'));

  return merge(app, bower);
});

gulp.task('html', ['clean'], function() {
  return gulp.src('app/static/index.html')
    .pipe(useref())
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulp.dest('dist/static'));
});

gulp.task('vulcanize', ['copy'], function() {
  return gulp.src('app/static/elements/elements.html')
      .pipe(vulcanize({
        stripComments: true,
        inlineScripts: true
      }))
      // .pipe(crisper({
      //   scriptInHead: true,
      //   onlySplit: false
      // }))
      .pipe(gulp.dest('dist/static/elements'));
});

// Generate config data for the <sw-precache-cache> element.
// This include a list of files that should be precached, as well as a (hopefully unique) cache
// id that ensure that multiple PSK projects don't share the same Cache Storage.
// This task does not run by default, but if you are interested in using service worker caching
// in your project, please enable it within the 'default' task.
// See https://github.com/PolymerElements/polymer-starter-kit#enable-service-worker-support
// for more context.
gulp.task('cache-config', ['copy'], function(callback) {
  var dir = 'dist/static';
  var config = {
    cacheId: packageJson.name,
    disabled: false
  };

  glob('{data,scripts}/**/*.*', {cwd: dir}, function(error, files) {
    if (error) {
      callback(error);
    } else {
      files.push(
        '/',
        'bower_components/webcomponentsjs/webcomponents-lite.min.js'
      );
      config.precache = files;

      var md5 = crypto.createHash('md5');
      md5.update(JSON.stringify(config.precache));
      config.precacheFingerprint = md5.digest('hex');

      var configPath = path.join(dir, 'cache-config.json');
      fs.writeFile(configPath, JSON.stringify(config), callback);
    }
  });
});

gulp.task('hugo', function(fetch) {

  // Ugly hack; from some reason running hugo --config=content/config.toml
  // behaves oddly
  return exec('cd content && hugo && cd ..', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    fetch(err);
  });
});

gulp.task('watch', ['default'], function() {
  gulp.watch([
      'app/static/index.html',
      'app/static/favicon.ico',
      'app/static/{scripts,elements,styles}/**/*',
      'content/content/blog/**/*'
    ], ['default']);
});

gulp.task('default', ['clean', 'hugo', 'shuffle', 'html', 'vulcanize', 'cache-config']);
