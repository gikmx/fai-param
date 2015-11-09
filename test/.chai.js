'use strict';

// Node modules
const Path = require('path');

// NPM modules
const Chai = require('chai');

// Chai configurations
Chai.config.includeStack = false;
Chai.config.showDiff     = false;

// globals
GLOBAL.expect = Chai.expect;