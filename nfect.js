/**
 * @project nfect
 * nfect.js -- Node.js Front-End Construction Tool
 * @file nfect.js
 * primary application driver (node.js module)
 * @author curtis zimmerman
 * @contact hello@curtisz.com
 * @license BSD3
 * @version 0.0.1b
 */

	/**
	 * add: adds a resource to nfect's resource tracker
	 * build: builds a resource from multiple discrete files
	 * config: assert a configuration for nfect
	 * go: execute nfect and provide optional callback
	 * on: subscribe or publish events
	 */

/**
 **************************************************************
 * nfect program flow:
 * 1. initialize environment / bootstrap
 * 2. accept descriptor and modify from defaults
 * 3. 
 * ... ?
 * 10. return callback call with function (e) {} data:
 *   a. e == error or null
 *   b. 
 **************************************************************
 */
 
/*
 * NOTES: 
 * -- NFECT automagically applies the following headers to client:
 *	 'Content-Type' with an appropriate mimetype based on file extension
 *	 'Content-Length' with content length
 * -- Default server status code sent to client is 200.
 * -- On error, NFECT logs messages to console and optionally logfile.
 *	 See below for callback notes.
 * -- NFECT attempts to detect output type based on file extension.
 * -- NFECT accepts a callback function instead of (or in addition to)
 *	 a client connection object. On error, information about error is 
 *	 passed to callback as first argument. Otherwise output is passed 
 *	 as default argument.
********************* example descriptor object:*************************
example: 'index.html'
********************* example descriptor object:*************************
example: ['head.html',{'db.js'},'body.html','foot.html']
********************* example descriptor object:*************************
example: {
	files: [{'head.html'},'body.html','foot.html'],
	headers: {'Expires':'4','Poop':0},
	output: 'html',
	status: 200
}
********************* example descriptor object:*************************
example: {
	files: ['db.js','results.js','footer.js'],
	headers: {'Expires':'4','Poop':0},
	output: 'plain',
	process: true,
	status: 200
};
************************************************************************/
 
module.exports = exports = nfect = (function() {
	"use strict";

	// client store
	var _clients = {};

	// internal data object
	var $app = {
		cache: [],
		settings: {
			loglevel: 2,
			resources: {
				fs: require('fs'),
				http: require('http'),
				url: require('url')
			},
			version: 'v0.0.1b'
		}
	};

	/**
	 * fire up the $nfect storage object
	 */
	var $nfect = {
		config: {
			calls: 0,
			default: 'index.html',
			error: null,
			headers: {},
			log: null,
			method: null,
			request: null,
			response: null
		},
		content: {
			error: {
				head: '<!doctype html><html><head><meta charset="utf-8"></head><body>',
				tail: '</body></html>'
			}
		},
		mime: {
			'css': 'text/css',
			'html': 'text/html',
			'js': 'application/javascript',
			'jpg': 'image/jpeg',
			'gif': 'image/gif',
			'png': 'image/png'
		},
		request: {
			method: null,
			ID: null,
			IDLength: 12,
			path: null,
			timestamp: null,
			url: null
		},
		// output options:
		//// output to connection?
		//// output content array, additional client headers, 
		//// output requires parse?, boolean array: process files?
		//// output status code, output type (html/plain)
		output: {
			display: false,
			content: [],
			headers: {},
			parse: false,
			process: [],
			status: 200,
			type: 'html'
		},
		// input descriptor type
		type: '',
		// nfect version
		version: 'v0.0.1b'
	};

/*\
	$nfect.config.calls: 0,
	$nfect.config.default: 'index.html',
	$nfect.config.error: null,
	$nfect.config.headers: {},
	$nfect.config.log: null,
	$nfect.config.method: null,
	$nfect.config.request: null,
	$nfect.config.response: null,
	$nfect.content.error.head: '<!doctype html><html><head><meta charset="utf-8"></head><body>',
	$nfect.content.errortail: '</body></html>'
	$nfect.mime['css']: 'text/css',
	$nfect.mime['html']: 'text/html',
	$nfect.mime['js']: 'application/javascript',
	$nfect.mime['jpg']: 'image/jpeg',
	$nfect.mime['gif']: 'image/gif',
	$nfect.mime['png']: 'image/png'
	$nfect.request.method: null,
	$nfect.request.ID: null,
	$nfect.request.IDLength: 12,
	$nfect.request.path: null,
	$nfect.request.timestamp: null,
	$nfect.request.url: null
		// output options:
		//// output to connection?
		//// output content array, additional client headers, 
		//// output requires parse?, boolean array: process files?
		//// output status code, output type (html/plain)
	$nfect.output.display: false,
	$nfect.output.content: [],
	$nfect.output.headers: {},
	$nfect.output.parse: false,
	$nfect.output.process: [],
	$nfect.output.status: 200,
	$nfect.output.type: 'html'
	$nfect.type: '',
	$nfect.version: 'v0.1.4'
\*/

	/**
	 * done.abcde ("async pattern") utility closure
	 */
	var _done = (function() {
		var cache = {};
		functdion _after( num, callback ) {
			for (var i=0,id='';i<10;i++,id+=Math.floor(Math.random()*10));
			return (!cache[id]) ? (cache[id] = {id:id,count:num,callback:callback}, id) : _after(num,callback);
		};
		function _bump( id ) {
			return (!cache[id]) ? false : (--cache[id].count == 0) ? cache[id].callback.apply() && _del(cache[id]) : true;
		};
		function _count( id ) {
			return (cache[id]) ? cache[id].count : -1;
		};
		function _dump( id ) {
			return (cache[id]) ? delete cache[id] : false;
		};
		function _empty() {
			cache = {};
		};
		return {
			after: _after,
			bump: _bump,
			count: _count,
			dump: _dump,
			empty: _empty
		};
	})();
	
	/**
	 * @function _log
	 * Exposes three logging functions.
	 * @method dbg
	 * Log a debug message if debugging is on.
	 * @param (string) data - The data to log.
	 * @return (boolean) Success indicator.
	 * @method err
	 * Log an error.
	 * @param (string) data - The data to log.
	 * @return (boolean) Success indicator.
	 * @method log
	 * Log a message.
	 * @param (string) data - The data to log.
	 * @return (boolean) Success indicator.
	 */
	var _log = (function() {
		var _con = function( data, type ) {
			var pre = ['[i] DEBUG: ', '[!] ERROR: ', '[+] '];
			return console.log(pre[type]+data);
		};
		var _dbg = function( data ) {
			if ($data.server.state.debug === true) return _con(data, 0);
		};
		var _err = function( data ) {
			return _con(data, 1);
		};
		var _file = function( status, summary ) {
			// @todo fix
			$nfect.config.resources.fs.writeFile($nfect.config.log, status+': '+summary, function(err) {
				return (err) ? _err(err), false : true;
			});
		};
		var _log = function( data ) {
			return _con(data, 2);
		};
		return {
			dbg: _dbg,
			err: _err,
			file: _file,
			log: _log
		};
	})();

	/**
	 * pub/sub/unsub pattern utility closure
	 */
	var _pubsub = (function() {
		// pub/sub/unsub pattern cache
		var cache = {};
		function _flush() {
			return cache = {};
		};
		function _pub(topic, args, scope) {
			if(cache[topic]) {
				var currentTopic = cache[topic],
					topicLength = currentTopic.length;
				for(var i=0; i<topicLength; i++) {
					currentTopic[i].apply(scope || this, args || []);
				}
			}
			return true;
		};
		function _sub(topic, callback) {
			if(!cache[topic]) {
				cache[topic] = [];
			}
			cache[topic].push(callback);
			return [topic, callback];
		};
		function _unsub(handle, total) {
			var topic = handle[0],
				cacheLength = cache[topic].length;
			if(cache[topic]) {
				for(var i=0; i<cacheLength; i++) {
					if(cache[topic][i] === handle) {
						cache[topic].splice(cache[topic][i], 1);
						if(total) {
							delete cache[topic];
						}
					}
				}
			}
			return true;
		};
		return {
			flush:_flush,
			pub:_pub,
			sub:_sub,
			unsub:_unsub
		};
	}());

	//debug start
		/*
		 * __File = {
		 *	 file = 'index.html', // filename to serve
		 *	 header = {}, // object collection of headers to serve with file
		 *	 method = 'get', // method to accept ('get', 'post', 'both')
		 *	 status = 200 // HTTP status code to serve file under
		 * };
		 */
	//debug end
	$classes = {
		File = (function() {
			var File = function( descriptor ) {
				if(!(this instanceof __File)) {
					return new __File(descriptor);
				}
				if(descriptor.file && descriptor.file !== null) {
					this.file = descriptor.file;
				}
				if(descriptor.header && descriptor.header !== null) {
					this.header = descriptor.header;
				}
				if(descriptor.method && descriptor.method !== null) {
					this.method = descriptor.method;
				}
				if(descriptor.status && descriptor.status !== null) {
					this.status = descriptor.status;
				}
			};
			File.prototype.stub = function() {
				return true;
			};
			return File;
		})(),
		NFECT = (function() {
			var NFECT = function( descriptor ) {
				this.descriptor = descriptor;
				this.files = [];
			};
			NFECT.prototype.add = function( descriptor ) {
				_log.log('.add()');
				if(++$nfect.config.calls == 1) {
					if(descriptor.file && descriptor.file !== null) {
						// yes, it's cool (http://es5.github.io/#x7.6)
						$nfect.config.default = descriptor.file;
					} else {
						descriptor.file = $nfect.config.default;
					}
					if(descriptor.method && descriptor.method !== null) {
					} else {
					}
				}
				if(descriptor.file && descriptor.file !== null) {
					$app.cache.push(new __File(descriptor));
					return this;
				} else if(descriptor.files && descriptor.files !== null) {
					var files = descriptor.files.slice();
					delete descriptor.files;
					files.forEach(function(file) {
						// shallow object copy
						var descriptorNew = {};
						for(var key in descriptor) {
							if(descriptor.hasOwnProperty(key)) {
								descriptorNew[key] = descriptor[key];
							}
						}
						descriptorNew.file = file;
						_add(descriptorNew);
					});
				}
			};
			NFECT.prototype.build = function( descriptor ) {
				_log.log('.build()');
				// method not implemented yet
				return this;
			};
			NFECT.prototype.config = function( descriptor ) {
				_log.log('.config()');
				if(typeof(descriptor.default) !== 'undefined') {
					$nfect.config.default = descriptor.default;
				}
				if(typeof(descriptor.error) !== 'undefined') {
					$nfect.config.error = descriptor.error;
				}
				$nfect.config.header = (typeof(descriptor.header) !== 'undefined') ? descriptor.header : {};
				if(typeof(descriptor.log) !== 'undefined') {
					$nfect.config.log = descriptor.log;
				}
				$nfect.config.method = (typeof(descriptor.method) !== 'undefined') ? descriptor.method : 'GET';
				}
				if(typeof(descriptor.request) !== 'undefined') {
					$nfect.config.request = descriptor.request;
				}
				if(typeof(descriptor.response) !== 'undefined') {
					$nfect.config.response = descriptor.response;
				}
				return this;
			};
			NFECT.prototype.go = function() {
				if($app.cache.length == 0) {
					_add({ method: 'GET' });
				}
				// default configuration
				$nfect.config.request.ID = _generateRID($nfect.config.request.IDLength);
				// make sure we're the last function on the event queue
				setTimeout(_init(),0);
			};
			return NFECT;
		})()
	};

	var $func = {
		getID: function( length ) {
			for (
				var i=0, id='', length=(typeof(length) === 'number') ? length : 8, chr='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
				i<length;
				i++, id+=chr.substr(Math.floor(Math.random()*chr.length),1)
			);
			return id;
		},
		isEmpty: function( obj ) {
			for(var prop in obj) {
				if(obj.hasOwnProperty(prop)) return false;
			}
			return true;
		},
		out: function( descriptor ) {
			//@fix update for new descriptor rules
			//@todo return output instead of writing output to connection
			if($nfect.output.display === true) {
				var output = $nfect.output.content.join('');
				// add content-length to our headers
				$nfect.output.headers['Content-Length'] = output.length;
				$nfect.conn.writeHead($nfect.output.status, $nfect.output.headers);
				$nfect.conn.write(output);
				$nfect.conn.end();
			}
			_pubsub.pub('/nfect/callback');
			//
			// from new function below
			//
			_log.log('$func.out()');
			if($nfect.config.log && $nfect.config.log !== null) {
				_log(0, '$func.out()');
			}
			// TODO FIX -- output stuff
			// method not yet implemented
			$nfect.config.response.writeHead(status, summary, {'Content-Type': 'text/html'});
			$nfect.config.response.write($nfect.content.error.head+status+' '+summary+$nfect.content.error.tail);
			$nfect.config.response.end();
		}
	};	

/*
var type = Object.prototype.toString.call(descriptor);
switch(type) {
	case '[object Array]':
		$nfect.type = 'array';
		$nfect.files = descriptor;
		break;
	case '[object Object]':
		$nfect.type = 'object';
		$nfect.descriptor = descriptor;
		$nfect.output.parse = true;
		break;
	case '[object String]':
		$nfect.type = 'string';
		$nfect.files.push(descriptor);
		break;
	default:
		_pubsub.pub('/nfect/error',[6,'Syntax Error: Malformed Descriptor: Improper Type']);
		return false;
*/

	(var _init = function() {
		_log.log('_init()');
		///////////////////////////////////////////////// end nfect() v1
		// initiate triggers
		var errorHandle = _pubsub.sub('/nfect/error', function(num, msg) {
			$nfect.type = 'error';
			$nfect.error.number = num;
			$nfect.error.message = msg;
			if($nfect.conn && typeof($nfect.conn) === 'object' && !$func.isEmpty($nfect.conn)) {
				$nfect.conn.writeHead(500, { 'Content-Type': 'text/plain' });
				$nfect.conn.write('NFECT Error '+$nfect.error.number+': '+$nfect.error.message);
				$nfect.conn.end();
			} else {
				console.log('NFECT Error '+$nfect.error.number+': ['+$nfect.error.message+']');
			}
			// initiate callback with error
			if($nfect.callback && typeof($nfect.callback) === 'function') {
				$nfect.callback.apply(this, ['Error '+$nfect.error.number+': ['+$nfect.error.message+']', null]);
			} else {
				return false;
			}
		});
		var formHandle = _pubsub.sub('/nfect/formed', _init);
		var initHandle = _pubsub.sub('/nfect/initialized', _parse);
		var parseHandle = _pubsub.sub('/nfect/parsed', _readFiles);
		var readHandle = _pubsub.sub('/nfect/files/read', _process);
		var processHandle = _pubsub.sub('/nfect/files/processed', $func.out);
		var callbackHandle = _pubsub.sub('/nfect/callback', function() {
			// initiate callback
			if($nfect.callback && typeof($nfect.callback) === 'function') {
				console.log('[NFECT] Initiating callback with output');
				$nfect.callback.apply(this, [null, $nfect.output.content.join('')]);
			}
		});
		// formalize arguments array
		var args = Array.prototype.slice.call(arguments);

		//////////////////////////////////////////////// end nfect() v1

		// @todo do some shit here!
		// general general configuration mismatch errors
		if(typeof($nfect.config.method) !== 'undefined') {
			if($nfect.config.request.method !== $nfect.config.method) {
				_error(413, "Method Not Supported");
				return false;
			}
		}
//
//
// THIS IS NEXT DUDE
// basically search through all $app.cache __File() objects and see if 
// any of the .file matches the inbound request.url. IF NONE MATCH, then 
// you MUST fallback onto the default, whatever that is set to
//
		// attempt to route
		if(($nfect.config.request.url !== file.file) && (index+1 < $app.cache.length)) {
			return false;
		} else {
			// test for default-ness
			if(index == $app.cache.length) {
				var defaultFile = true;
			} else {
				var defaultFile = false;
			}
			$nfect.config.request.path = $nfect.config.resources.url.parse($nfect.config.request.url).pathname;
			var fileType = $nfect.config.request.path.substr($nfect.config.request.path.lastIndexOf('.')+1);
			var mimeType = $nfect.config.mime[fileType];
			if(mimeType && mimeType !== null) {
				$nfect.config.header['Content-Type'] = mimeType;
			} else {
				$nfect.config.header['Content-Type'] = 'text/plain';
			}
			if(file.method && file.method !== null) {
				if($nfect.config.request.method !== file.method) {
					_error(413, "Method Not Supported");
					return false;
				}
			}
			if($nfect.config.header && $nfect.config.header !== null) {
				for(header in $nfect.config.header) {
				if($nfect.config.header.hasOwnProperty(header)) {
						file.header[header] = $nfect.config.header[header];
					}
				}
			}
			$func.out(file);
		}
	})();

	/**
	 * add: adds a resource to nfect's resource tracker
	 * build: builds a resource from multiple discrete files
	 * bind: bind a callback to an event
	 * config: assert a configuration for nfect
	 * fire: fire an event to trigger callback
	 *   (or just use on() and on() will detect if it gets a string or a string and a function)
	 * go: execute nfect and provide optional callback
	 * on: subscribe or publish events
	 */
	return {
		add: _add,
		build: _build,
		bind: _bind,
		config: _config,
		fire: _fire,
		go: _go,
		on: _on
	};
})();

/* ********************************************************************
example usage:
// nfect is the basic object call
nfect.config(
	// configure the nfect object
	default: 'index.html', //default first add()ed file or 'index.html'
	error: {
		400: '400.html',
		404: '404.html',
		413: '413.html',
		451: '451.html',
		500: '500.html',
		default: 'default.html'
	},
	header: {
		'Expires': Date.now()+1000000,
		'Server-Assisted': 'random_text_here'
	},
	log: 'nfect-access.log', //default no logging
	request: req,
	response: res
).add(
	// add a file
	file: 'index.html', //default 'index.html'
	files: ['index.html', 'defaultc.css', 'site.js'],
	header: {
		'Content-Type': 'text.plain' //default matches filename extension
	},
	method: 'get', //default get
	status: 200 //default 200
).go();
********************************************************************* */