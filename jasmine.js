'use strict';

var Reporter = require('jasmine-console-reporter');
var Jasmine = require('jasmine');
var jasmine = new Jasmine();

jasmine.loadConfig({
    spec_dir: 'dist',
    spec_files: ['**/*.spec.js']
});

jasmine.addReporter(new Reporter());
jasmine.execute();