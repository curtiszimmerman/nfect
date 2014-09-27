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
	var $nfect = {};
	
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
		version: 'v0.1.4'
	};

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
			_console.log('_out()');
			if($nfect.config.log && $nfect.config.log !== null) {
				_log(0, '_out()');
			}
			// TODO FIX -- output stuff
			// method not yet implemented
			$nfect.config.response.writeHead(status, summary, {'Content-Type': 'text/html'});
			$nfect.config.response.write($nfect.content.error.head+status+' '+summary+$nfect.content.error.tail);
			$nfect.config.response.end();
		}
	};
	
	// initialize the $nfect object
	function _init() {
		var argsLength = $nfect.args.length,
			descriptor = {},
			callback = {},
			connection = {};
		//parse arguments and behave accordingly
		switch(argsLength) {
			case 1:
				descriptor = $nfect.args[0];
				break;
			case 2:
				descriptor = $nfect.args[0];
				if(typeof($nfect.args[1]) === 'function') {
					callback = $nfect.args[1];
				} else if(typeof($nfect.args[1]) === 'object') {
					connection = $nfect.args[1];
				} else {
					_pubsub.pub('/nfect/error',[2,'Syntax Error: Malformed Descriptor: Argument Type']);
					return false;
				}
				break;
			case 3:
				descriptor = $nfect.args[0];
				if(typeof($nfect.args[1]) === 'object' && typeof($nfect.args[2]) === 'function') {
					connection = $nfect.args[1];
					callback = $nfect.args[2];
				} else if(typeof($nfect.args[1]) === 'function' && typeof($nfect.args[1]) === 'object') {
					callback = $nfect.args[1];
					connection = $nfect.args[2];
				} else {
					_pubsub.pub('/nfect/error',[3,'Syntax Error: Malformed Descriptor: Argument Type']);
					return false;
				}
				break;
			default:
				_pubsub.pub('/nfect/error',[4,'Syntax Error: Malformed Descriptor: Argument Number']);
				return false;
		}
		if(!descriptor) {
			_pubsub.pub('/nfect/error',[5,'Syntax Error: Malformed Descriptor: Missing']);
			return false;
		}
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
		}
		if(callback && typeof(callback) == 'function') {
			$nfect.callback = callback;
		}
		// sanity check connection object (_maxListeners *should* be positive int or zero)
		if(connection && typeof(connection) == 'object' && connection._maxListeners >= 0) {
			$nfect.conn = connection;
			$nfect.output.display = true;
		}
		// trigger initialized event handler
		_pubsub.pub('/nfect/initialized');
	};
	
	function _parse() {
		var plain = true,
			process = false;
		if($nfect.output.parse) {
			if(!$func.isEmpty($nfect.descriptor) && $nfect.descriptor.files && $nfect.descriptor.files.length > 0) {
				// copy descriptor files array to nfect storage array
				$nfect.files = $nfect.descriptor.files;
			} else {
				_pubsub.pub('/nfect/error',[7,'Syntax Error: Descriptor Empty']);
				return false;
			}
			if($nfect.descriptor.process === true) {
				// override process setting
				//fix -- is this is frickin rong, dude?
				process = true;
			} else {
				process = false;
			}
			// data for input files
			if(!$func.isEmpty($nfect.descriptor.data) && $nfect.descriptor.data) {
				$nfect.data = $nfect.descriptor.data;
			}
			// additional headers
			if(!$func.isEmpty($nfect.descriptor.headers) && $nfect.descriptor.headers) {
				for(var header in $nfect.descriptor.headers) {
					$nfect.output.headers[header] = $nfect.descriptor.headers[header];
				}
			}
			// output type
			if($nfect.descriptor.output === 'html') {
				plain = false;
			} else if($nfect.descriptor.output === 'plain') {
				plain = true;
			}
		}
		var filesLength = $nfect.files.length,
			regex = /\.html/i;
		for(var i=0; i<filesLength; i++) {
			// find file process specifiers or override process setting
			var file = $nfect.files[i];
			if(typeof(file) === '[object Object]') {
				process = true;
				for(var piece in file) {
					if(typeof(piece) === '[object String]') {
						$nfect.files[i] = piece;
					} else {
						_pubsub.pub('/nfect/error',[7,'Syntax Error: Malformed Descriptor: Files Array']);
						return false;
					}
				}
			}
			if(process === true) {
				$nfect.output.process[i] = true;
			} else {
				$nfect.output.process[i] = false;
			}
			// content detection
			if(file.match(regex)) {
				plain = false;
			}
		}
		// output type
		if(plain === false) {
			$nfect.output.type = 'html';
		} else {
			$nfect.output.type = 'plain';
		}
		_pubsub.pub('/nfect/parsed');
	};
	
	function _process() {
		var contentLength = $nfect.output.content.length;
		if($nfect.output.type === 'html') {
			$nfect.output.headers['Content-Type'] = 'text/html';
		} else {
			$nfect.output.headers['Content-Type'] = 'text/plain';
		}
		//fix -- add test for $nfect.state.process === true ? process : noprocess;
		if(true) {
		} else {
			_pubsub.pub('/nfect/error',[8,'Syntax Error: Descriptor Empty']);
			return false;
		}
		_pubsub.pub('/nfect/files/processed');
	};
	
	//todo set up eventemitter for fileRead.complete() to trigger out()
	function _readFiles() {
		var filesLength = $nfect.files.length,
			filesRead = 0,
			fs = require('fs');
		var contentStorage = [];
		var fileHandle = _pubsub.sub('/nfect/input/file', function(position, content) {
			filesRead++;
			contentStorage[position] = content;
			// preserve input file order
			if(filesRead === filesLength) {
				for(var i=0; i<filesLength; i++) {
					$nfect.output.content.push(contentStorage[i]);
				}
				_pubsub.pub('/nfect/files/read');
				return;
			}
		});
		for(var i=0; i<filesLength; i++) {
			// pass iterator into closure
			(function(iteration) {
				var nextFile = $nfect.files[iteration];
				fs.readFile(nextFile, 'utf8', function(err, contents) {
					if(err) {
						_pubsub.pub('/nfect/error',[1,'File Read Error: ['+err+']']);
						return false;
					} else {
						_pubsub.pub('/nfect/input/file',[iteration,contents]);
					}
				});
			}(i));
		}
	};
	
	function nfect() {
		// zeroize data objects
		$nfect = { };
		_pubsub.flush();
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
		var processHandle = _pubsub.sub('/nfect/files/processed', _out);
		var callbackHandle = _pubsub.sub('/nfect/callback', function() {
			// initiate callback
			if($nfect.callback && typeof($nfect.callback) === 'function') {
				console.log('[NFECT] Initiating callback with output');
				$nfect.callback.apply(this, [null, $nfect.output.content.join('')]);
			}
		});
		// formalize arguments array
		var args = Array.prototype.slice.call(arguments);
		// guarantee the trigger pull gets put onto the event queue
		setTimeout(_form(args),0);
	};

/////////////////////////////////////
//
// here some changes were made (new nfect lol)
//
/////////////////////////////////////

	var _console = (function(loglevel) {
		loglevel = (typeof(loglevel) === 'number') ? loglevel : 2;
		var _error = function(message) {
			_output(message, 0, ['[!]']);
		};
		var _log = function(message, level) {
			level = (typeof(level) === 'number') ? level : 2;
			_output(message, level, ['[*]','[+]','[=]','[-]']);
		};
		var _output = function(message, level, notice) {
			if(level <= loglevel) {
				if(level > 3) {
					level = 3;
				}
				console.log(notice[level]+' '+message);
			}
		};
		return {
			err: _error,
			log: _log
		};
	})($nfect.config.loglevel);

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

	function __File(descriptor) {
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

	var _add = function(descriptor) {
		_console.log('.add()');
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

	var _build = function(descriptor) {
		_console.log('.build()');
		// method not implemented yet
		return this;
	};

	var _config = function(descriptor) {
		_console.log('.config()');
		if(descriptor.default && descriptor.default !== null) {
			$nfect.config.default = descriptor.default;
		}
		if(descriptor.error && descriptor.error !== null) {
			$nfect.config.error = descriptor.error;
		}
		if(descriptor.header && descriptor.header !== null) {
			$nfect.config.header = descriptor.header;
		} else {
			$nfect.config.header = {};
		}
		if(descriptor.log && descriptor.log !== null) {
			$nfect.config.log = descriptor.log;
		}
		if(descriptor.method && descriptor.method !== null) {
			$nfect.config.method = descriptor.method;
		} else {
			$nfect.config.method = 'GET';
		}
		if(descriptor.request && descriptor.request !== null) {
			$nfect.config.request = descriptor.request;
		}
		if(descriptor.response && descriptor.response !== null) {
			$nfect.config.response = descriptor.response;
		}
		return this;
	};

	var _go = function() {
		if($app.cache.length == 0) {
			_add({ method: 'GET' });
		}
		// default configuration
		$nfect.config.request.ID = _generateRID($nfect.config.request.IDLength);
		// make sure we're the last function on the event queue
		setTimeout(_init(),0);
	};

	var _init = function() {
		_console.log('_init()');
		// TODO FIX -- do some shit here!
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
				_out(file);
			}
		});
	};

	return {
		add: _add,
		build: _build,
		config: _config,
		go: _go
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