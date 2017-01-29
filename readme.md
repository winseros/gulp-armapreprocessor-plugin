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
