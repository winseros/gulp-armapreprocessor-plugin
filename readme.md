[![node][node-image]][node-url] [![npm][npm-image]][npm-url] [![Travis branch][travis-image]][travis-url] [![Coveralls branch][coveralls-image]][coveralls-url] [![Dependencies][david-image]][david-url]

# Gulp Arma Preprocessor plugin
The plugin's goal is to resolve [preprocessor instructions](https://community.bistudio.com/wiki/PreProcessor_Commands) of Arma2/Arma3 missions and addons source files using [Gulp](http://gulpjs.com).

## Installation
```
npm install gulp-armapreprocessor
```

## Usage
```
import gulp from 'gulp';
import preprocessor from 'gulp-armapreprocessor';

gulp.task('preprocess', () => {
	return gulp.src('description.ext')
	  .pipe(preprocessor())
	  .pipe(/*further processing*/);
});
```

#####The following preprocessor instructions are not supported:
* [__EXEC](https://community.bistudio.com/wiki/PreProcessor_Commands#EXEC)
* [__EVAL](https://community.bistudio.com/wiki/PreProcessor_Commands#EVAL)
* [\_\_LINE\_\_](https://community.bistudio.com/wiki/PreProcessor_Commands#LINE)
* [\_\_FILE\_\_](https://community.bistudio.com/wiki/PreProcessor_Commands#FILE)

[node-url]: https://nodejs.org
[node-image]: https://img.shields.io/node/v/gulp-armapreprocessor.svg

[npm-url]: https://www.npmjs.com/package/gulp-armapreprocessor
[npm-image]: https://img.shields.io/npm/v/gulp-armapreprocessor.svg

[travis-url]: https://travis-ci.org/winseros/gulp-armapreprocessor-plugin
[travis-image]: https://img.shields.io/travis/winseros/gulp-armapreprocessor-plugin/master.svg

[coveralls-url]: https://coveralls.io/github/winseros/gulp-armapreprocessor-plugin
[coveralls-image]: https://img.shields.io/coveralls/winseros/gulp-armapreprocessor-plugin/master.svg

[david-url]: https://david-dm.org/winseros/gulp-armapreprocessor-plugin
[david-image]: https://david-dm.org/winseros/gulp-armapreprocessor-plugin/master.svg
