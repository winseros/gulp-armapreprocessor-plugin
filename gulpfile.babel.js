import gulp from 'gulp';
import tsc from 'gulp-typescript';
import tslint from 'gulp-tslint';
import sourcemaps from 'gulp-sourcemaps';
import jasmine from 'gulp-jasmine';
import consoleReporter from 'jasmine-console-reporter';
import watch from 'gulp-watch';
import istanbul from 'gulp-istanbul';
import coveralls from 'gulp-coveralls';
import remapIstanbul from 'remap-istanbul/lib/gulpRemapIstanbul';
import del from 'del';
import path from 'path';

const dist = './dist';
const sourceFiles = './src/**/*.ts';
const typingFiles = './typings/**/index.d.ts';
const libFiles = ['./src/cpp.js'];
const testSpecs = './dist/**/*.spec.js';
const testSources = ['./dist/**/*.js', `!${testSpecs}`, `!./dist/cpp.js`];
const testData = './src/**/test_data/**/*';
const coverageDir = './.coverage'
const lcovFile = path.join(coverageDir, 'lcov.info');

gulp.task('clean', () => {
    return del([`${dist}/*`]);
});

gulp.task('tslint', () => {
    return gulp.src(sourceFiles)
        .pipe(tslint({
            formatter: "verbose"
        })).pipe(tslint.report({
            emitError: false
        }));
});

gulp.task('copy:libs', ['clean'], () => {
    return gulp.src(libFiles)
        .pipe(gulp.dest(dist));
});

gulp.task('copy:test_data', ['clean'], () => {
    return gulp.src(testData)
        .pipe(gulp.dest(dist));
});

gulp.task('assemble', ['clean', 'tslint', 'copy:libs', 'copy:test_data'], () => {
    const tsproject = tsc.createProject('tsconfig.json');

    return gulp.src([typingFiles, sourceFiles])
        .pipe(sourcemaps.init())
        .pipe(tsproject()).js
        .pipe(sourcemaps.write('./', {
            includeContent: false,
            sourceRoot: '../src'
        }))
        .pipe(gulp.dest(dist));
});

gulp.task('test:run', ['assemble'], () => {
    return gulp.src(testSpecs)
        .pipe(jasmine({
            verbose: true,
            reporter: new consoleReporter()
        }));
});

gulp.task('cover:instrument', ['assemble'], () => {
    return gulp.src(testSources)
        .pipe(istanbul())
        .pipe(istanbul.hookRequire());
});

gulp.task('cover:run', ['cover:instrument'], () => {
    return gulp.src(testSpecs)
        .pipe(jasmine())
        .pipe(istanbul.writeReports({
            dir: dist,
            reporters: ['json']
        }));
});

gulp.task('cover:report', ['cover:run'], () => {
    return gulp.src(path.join(dist, 'coverage-final.json'))
        .pipe(remapIstanbul({
            reports: { html: coverageDir, lcovonly: lcovFile }
        }));
});

gulp.task('cover:coveralls', ['cover:report'], () => {
    return gulp.src(lcovFile)
        .pipe(coveralls());
});

gulp.task('watch', ['assemble'], () => {
    return watch([sourceFiles, testData], () => {
        gulp.start('assemble');
    });
});