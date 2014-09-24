/*
 *  nfect.js -- Node.js Front-End Construction Tool
 *  pass in an object describing the files and their function and 
 *  nfect outputs it properly to the client
 */
 
/*
 * NOTES: 
 * -- without connection, nfect returns output as string
 * -- NFECT automagically applies the following headers to client:
 *   'Content-Type': 'text/plain' (or 'text/html' depending on content)
 *   'Content-Length': (int)output.length
 * -- Default server status code sent to client is 200.
 * -- On error, NFECT aborts operation and only outputs error number 
 *   and error message. See below for callback notes.
 * -- NFECT attempts to detect output type based on file extension.
 * -- NFECT accepts a callback function instead of (or in addition to)
 *   a client connection object. On error, information about error is 
 *   passed to callback as first argument. Otherwise output is passed 
 *   as default argument.
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
	var _nfect = {};

	/**
	 * fire up the _nfect storage object
	 */
	var $nfect = {
		// initial arguments
		args: args,
		// callback if provided
		callback: {},
		// web server connection
		conn: {},
		// this is how we encapsulate and transport data from outside
		data: {},
		// internal copy of the use descriptor
		descriptor: {},
		// nfect error details
		error: {
			message: '',
			number: 0
		},
		// files for processing
		files: [],
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
		function _after( num, callback ) {
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
		var _log = function( data ) {
			return _con(data, 2);
		};
		return {
			dbg: _dbg,
			err: _err,
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
	
	// generate random client ID
	function _genID() {
		// there's no reason you shouldn't just use a class-like variable
		// to iterate and then store newly-created nfect objects in the 
		// client array indexed to that iterated variable, like:
		// for(i=0;i<20;i++) { nfect_client++; clients[nfect_client] = foo; }
	};
	
	// initialize the _nfect object
	function _init() {
		var argsLength = _nfect.args.length,
			descriptor = {},
			callback = {},
			connection = {};
		//parse arguments and behave accordingly
		switch(argsLength) {
			case 1:
				descriptor = _nfect.args[0];
				break;
			case 2:
				descriptor = _nfect.args[0];
				if(typeof(_nfect.args[1]) === 'function') {
					callback = _nfect.args[1];
				} else if(typeof(_nfect.args[1]) === 'object') {
					connection = _nfect.args[1];
				} else {
					_pubsub.pub('/nfect/error',[2,'Syntax Error: Malformed Descriptor: Argument Type']);
					return false;
				}
				break;
			case 3:
				descriptor = _nfect.args[0];
				if(typeof(_nfect.args[1]) === 'object' && typeof(_nfect.args[2]) === 'function') {
					connection = _nfect.args[1];
					callback = _nfect.args[2];
				} else if(typeof(_nfect.args[1]) === 'function' && typeof(_nfect.args[1]) === 'object') {
					callback = _nfect.args[1];
					connection = _nfect.args[2];
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
				_nfect.type = 'array';
				_nfect.files = descriptor;
				break;
			case '[object Object]':
				_nfect.type = 'object';
				_nfect.descriptor = descriptor;
				_nfect.output.parse = true;
				break;
			case '[object String]':
				_nfect.type = 'string';
				_nfect.files.push(descriptor);
				break;
			default:
				_pubsub.pub('/nfect/error',[6,'Syntax Error: Malformed Descriptor: Improper Type']);
				return false;
		}
		if(callback && typeof(callback) == 'function') {
			_nfect.callback = callback;
		}
		// sanity check connection object (_maxListeners *should* be positive int or zero)
		if(connection && typeof(connection) == 'object' && connection._maxListeners >= 0) {
			_nfect.conn = connection;
			_nfect.output.display = true;
		}
		// trigger initialized event handler
		_pubsub.pub('/nfect/initialized');
	};
	
	//utility function for determining emptiness of object
	function _isEmpty(obj) {
		for(var prop in obj) {
			if(obj.hasOwnProperty(prop)) return false;
		}
		return true;
	};
	
	//FIX -- update for new descriptor rules
	//todo return output instead of writing output to connection
	function _out() {
//debug1
console.log('*** [NFECT].(out).writing!:['+_nfect.output.content+'] output.display['+_nfect.output.display+']');
		if(_nfect.output.display === true) {
			var output = _nfect.output.content.join('');
			// add content-length to our headers
			_nfect.output.headers['Content-Length'] = output.length;
			_nfect.conn.writeHead(_nfect.output.status, _nfect.output.headers);
			_nfect.conn.write(output);
			_nfect.conn.end();
		}
		_pubsub.pub('/nfect/callback');
	};
	
	function _parse() {
//debug1
console.log('[NFECT]:['+_nfect.files[0]+']___________-------->>>>>>> parsing!');
		var plain = true,
			process = false;
		if(_nfect.output.parse) {
			if(!_isEmpty(_nfect.descriptor) && _nfect.descriptor.files && _nfect.descriptor.files.length > 0) {
				// copy descriptor files array to nfect storage array
				_nfect.files = _nfect.descriptor.files;
			} else {
				_pubsub.pub('/nfect/error',[7,'Syntax Error: Descriptor Empty']);
				return false;
			}
			if(_nfect.descriptor.process === true) {
				// override process setting
				//fix -- is this is frickin rong, dude?
				process = true;
			} else {
				process = false;
			}
			// data for input files
			if(!_isEmpty(_nfect.descriptor.data) && _nfect.descriptor.data) {
				_nfect.data = _nfect.descriptor.data;
			}
			// additional headers
			if(!_isEmpty(_nfect.descriptor.headers) && _nfect.descriptor.headers) {
				for(var header in _nfect.descriptor.headers) {
					_nfect.output.headers[header] = _nfect.descriptor.headers[header];
				}
			}
			// output type
			if(_nfect.descriptor.output === 'html') {
				plain = false;
			} else if(_nfect.descriptor.output === 'plain') {
				plain = true;
			}
		}
		var filesLength = _nfect.files.length,
			regex = /\.html/i;
		for(var i=0; i<filesLength; i++) {
			// find file process specifiers or override process setting
			var file = _nfect.files[i];
			if(typeof(file) === '[object Object]') {
				process = true;
				for(var piece in file) {
					if(typeof(piece) === '[object String]') {
						_nfect.files[i] = piece;
					} else {
						_pubsub.pub('/nfect/error',[7,'Syntax Error: Malformed Descriptor: Files Array']);
						return false;
					}
				}
			}
			if(process === true) {
				_nfect.output.process[i] = true;
			} else {
				_nfect.output.process[i] = false;
			}
			// content detection
			if(file.match(regex)) {
				plain = false;
			}
		}
		// output type
		if(plain === false) {
			_nfect.output.type = 'html';
		} else {
			_nfect.output.type = 'plain';
		}
		_pubsub.pub('/nfect/parsed');
	};
	
	function _process() {
//debug1
console.log('[NFECT]:['+_nfect.files[0]+'] ___________-------->>>>>>> processing!');
/*
 * 
 * 
 * trouble afoot at the circle-k:
 * for some reason node.js is hiccuping here on output of (i think)
 * test2.js... it comes down to event loop semantics, i believe, 
 * because some test runs of the file pile run just fine, but most
 * don't. test, test2, test3 runs fine when everything runs in order, 
 * but otherwise nope. hangs
 * 
 * 
 * 
 */
		var contentLength = _nfect.output.content.length;
		if(_nfect.output.type === 'html') {
			_nfect.output.headers['Content-Type'] = 'text/html';
		} else {
			_nfect.output.headers['Content-Type'] = 'text/plain';
		}
//debug1
console.log('_______________ output.content.len:['+contentLength+']');
		//fix -- add test for _nfect.state.process === true ? process : noprocess;
		if(true) {
		} else {
			_pubsub.pub('/nfect/error',[8,'Syntax Error: Descriptor Empty']);
			return false;
		}
		_pubsub.pub('/nfect/files/processed');
	};
	
	//todo set up eventemitter for fileRead.complete() to trigger out()
	function _readFiles() {
//debug1
console.log('[NFECT]:['+_nfect.files[0]+'] ___________-------->>>>>>> reading files!');
		var filesLength = _nfect.files.length,
			filesRead = 0,
			fs = require('fs');
		var contentStorage = [];
		var fileHandle = _pubsub.sub('/nfect/input/file', function(position, content) {
			filesRead++;
			contentStorage[position] = content;
			// preserve input file order
			if(filesRead === filesLength) {
				for(var i=0; i<filesLength; i++) {
					_nfect.output.content.push(contentStorage[i]);
				}
				_pubsub.pub('/nfect/files/read');
				return;
			}
		});
		for(var i=0; i<filesLength; i++) {
			// pass iterator into closure
			(function(iteration) {
//debug1
console.log('000 [NFECT] -=-=-=-=-=-=-=- iter['+iteration+'] files[iter]:['+_nfect.files[iteration]+']');
				var nextFile = _nfect.files[iteration];
				fs.readFile(nextFile, 'utf8', function(err, contents) {
//debug1
console.log('===--->>> [NFECT].(basic) FIRST DUMP OF FILE:['+contents+']');
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
		_nfect = { };
		_pubsub.flush();
		// initiate triggers
		var errorHandle = _pubsub.sub('/nfect/error', function(num, msg) {
			_nfect.type = 'error';
			_nfect.error.number = num;
			_nfect.error.message = msg;
			if(_nfect.conn && typeof(_nfect.conn) === 'object' && !_isEmpty(_nfect.conn)) {
				_nfect.conn.writeHead(500, { 'Content-Type': 'text/plain' });
				_nfect.conn.write('NFECT Error '+_nfect.error.number+': '+_nfect.error.message);
				_nfect.conn.end();
			} else {
				console.log('NFECT Error '+_nfect.error.number+': ['+_nfect.error.message+']');
			}
			// initiate callback with error
			if(_nfect.callback && typeof(_nfect.callback) === 'function') {
				_nfect.callback.apply(this, ['Error '+_nfect.error.number+': ['+_nfect.error.message+']', null]);
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
			if(_nfect.callback && typeof(_nfect.callback) === 'function') {
				console.log('[NFECT] Initiating callback with output');
				_nfect.callback.apply(this, [null, _nfect.output.content.join('')]);
			}
		});
		// formalize arguments array
		var args = Array.prototype.slice.call(arguments);
		// guarantee the trigger pull gets put onto the event queue
		setTimeout(_form(args),0);
	};
	
	// expose nfect
	return {
		nfect: nfect
	};
}());

/* export module functions */
module.exports = nfect.nfect;
