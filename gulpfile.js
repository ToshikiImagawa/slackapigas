"use strict";

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

/**
 * Path Setting
 */
var path = {
    src: {
        ts: './src/ts/**/*.ts'
    },
    dest: {
        gs: './dest/gs/'
    }
};

// TypeScript
gulp.task('ts', function () {
    var typescriptProject = $.typescript.createProject({
        module: 'amd',
        target: 'es5'
    });
    return gulp.src([path.src.ts])
        .pipe($.typescript(typescriptProject))
        .pipe(gulp.dest('./gs'));
});

// watch
gulp.task('watch', function () {
    gulp.watch(path.src.ts, ['ts']);
});

// task
gulp.task('default', ['watch']);

// EsLint
gulp.task('esLint', function () {
    return gulp.src([path.src.js])
        .pipe($.eslint())
        .pipe($.eslint.format())
        .pipe($.eslint.failAfterError());
});
