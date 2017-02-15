[![node][node-image]][node-url] [![npm][npm-image]][npm-url] [![Travis branch][travis-image]][travis-url] [![Coveralls branch][coveralls-image]][coveralls-url] [![Dependencies][david-image]][david-url]

# Gulp Arma Preprocessor plugin
The plugin's goal is to resolve [preprocessor instructions](https://community.bistudio.com/wiki/PreProcessor_Commands) of Arma2/Arma3 missions and addons source files using [Gulp](http://gulpjs.com).

## Installation
```
npm install gulp-armapreprocessor
```

## Usage
```
const gulp = require 'gulp';
const preprocessor = require 'gulp-armapreprocessor';

gulp.task('preprocess', () => {
	return gulp.src('description.ext')
	  .pipe(preprocessor())
	  .pipe(/*further processing*/);
});
```

## Unsupported instructions
* [__EXEC](https://community.bistudio.com/wiki/PreProcessor_Commands#EXEC)
* [__EVAL](https://community.bistudio.com/wiki/PreProcessor_Commands#EVAL)
* [\_\_LINE\_\_](https://community.bistudio.com/wiki/PreProcessor_Commands#LINE)
* [\_\_FILE\_\_](https://community.bistudio.com/wiki/PreProcessor_Commands#FILE)

## Include resolution

The plugin will try to resolve `#include` statements, fetching the required files from the fyle system, relatively to the current file being processed. I.e. if you process a file `${cwd}\src\description.ext` and there a line `#include "config\defines.hpp"` in it, the resulting file `${cwd}\src\config\defines.hpp` will be fetched.

## Using preprocessor cache

In some situations you may need to substitute `#include`'s content, say if the `#include`'d file has been preprocessed by another stream and has not been persisted on disk. In that case the following snippet may become handy.

```
const gulp = require 'gulp';
const preprocessor = require 'gulp-armapreprocessor';

const storage = preprocessor.createStorage();

gulp.task('preprocess', () => {
    const defines = gulp.src('defines.hpp')
        .pipe(/*some processing goes here*/)
        .pipe(storage.add());//save the preprocessed version into a storage

    const description = gulp.src('description.ext')//contains a line: #include "defines.hpp"
        .pipe(preprocessor({ storage: storage }))//all the #include's will be resolved against the storage first
        .pipe(/*further processing*/);

    /*some further actions on streams*/
});
```

## Plugin API
### preprocessor([options])
Returns: `PreprocessorStream`

#### options
Required: `no`

#### options.storage
Required: `no`

Type: `PreprocessorStorage`

### preprocessor.createStorage()
Returns: `PreprocessorStorage`

## PreprocessorStorage API
### storage.add()
Add the current stream content into the storage

### storage.clear()
Clean out the storage

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
