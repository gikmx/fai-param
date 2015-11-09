'use strict';

/*»
# fai-param

*Allows [fai](http://github.com/gikmx/fai.git) to parse parameters asyncronically.*

The module is really just a wrapper around [argv](https://www.npmjs.com/package/argv)
but using callbacks instead.

«*/

// Node modules
const Path = require('path');
// NPM modules
const Argv = require('argv');

/*»
## Configuration

- `attr` exposed members descriptors.
«*/
const CONF = require(Path.join(__dirname, '..', 'fai'));

// Locals
const ATTR = { // default attributes for «private» members.
	enumerable   : false,
	writable     : false,
	configurable : false
};

const NEXT = function(response={}){
	// Make sure the response is always an object
	if (!response || response.constructor !== Object) response = {};
	// Extend param.response with the one we got.
	this.response = Object.assign({}, this.response, response);
	// grab the first option available, if nothing found, then call the parse callback.
	let option = this.options.shift();
	if (!option) return this.callback(null, this.response);
	// populate the response with the current value.
	this.response[option.name] = option.value;
	// let know the callback, and allow recursion to happen.
	option.callback.call(option, null, this.response, NEXT.bind(this));
};


module.exports = function Param(conf={}){
	this.log.trace('init');

	// populate configuration
	// TODO: This should throw an error.
	if (!conf || conf.constructor !== Object) conf = {};
	conf = Object.assign({}, CONF, conf);

	// Make sure an attribute property is present
	if (!conf.attr || conf.attr.constructor !== Object) conf.attr = {};

	let ﬁ = this;
	let param = Object.create({});

	// Declare «read only»  properties.
	{
		let attr;
		// Define an empty «options» array inside the instance
		attr = Object.assign({ value: [] }, ATTR);
		Object.defineProperty(param, 'options', attr);
		// Define the final response
		attr = Object.assign({}, ATTR, { value: {}, writable: true });
		Object.defineProperty(param, 'response', attr);
	}

	Object.defineProperty(param, 'add', Object.assign({
		value:function param_add(option, cback){
			ﬁ.log.trace('init');
			let attr;
			if (!option || option.constructor !== Object)
				ﬁ.throw(`Expecting an object, got: ${typeof option}`);

			// when no callback is provided, use it one by default.
			if (!cback || cback.constructor !== Function)
				cback = (err, response, next)=> next();

			// define a «private» method «call», it will be called when the option is used.
			attr = Object.assign({ value:cback }, ATTR);
			Object.defineProperty(option, 'callback', attr);

			// define a «private» method «call», it will be called when the option is used.
			attr = Object.assign({value:null}, ATTR, {enumerable: true, writable: true});
			Object.defineProperty(option, 'value', attr);

			// TODO: Force an error to try this implementation.
			try {
				Argv.option(option);
			} catch (e){
				option.callback.call(option, e);
				return null;
			}

			param.options.push(option);
			return option;
		}
	}, conf.attr));

	Object.defineProperty(param, 'parse', Object.assign({
		value:function param_parse(cback){
			ﬁ.log.trace('init');
			if (param.parsed) ﬁ.throw('Params already parsed.');
			let attr, options;

			// make sure there's always a callback
			if (!cback || cback.constructor !== Function) ﬁ.throw('Expecting a callback');

			Object.defineProperty(param, 'parsed', Object.assign({value:true}, ATTR));
			Object.defineProperty(param, 'callback', Object.assign({value:cback}, ATTR));

			try {
				options = Argv.run().options;
			} catch (e){
				return param.callback.call(param, e, this.response);
			}

			// iterate sent options and set corresponding instance property value
			for (let name in options)
				for (let i in param.options)
					if (param.options[i].name === name)
						param.options[i].value = options[name];

			// NEXT will be called each time an option gets a value,
			// this initializes the cycle.
			NEXT.call(param);
		}
	}, conf.attr));

	return param;
}