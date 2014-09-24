/*
 *  nfect.js -- Node.js Front-End Construction Tool
 *  pass in an object describing the files and their function and 
 *  nfect outputs it properly to the client
 */
 
/*
 * NOTES: 
 * -- NFECT automagically applies the following headers to client:
 *   'Content-Type' with an appropriate mimetype based on file extension
 *   'Content-Length' with content length
 * -- Default server status code sent to client is 200.
 * -- On error, NFECT logs messages to console and optionally logfile.
 *   See below for callback notes.
 * -- NFECT attempts to detect output type based on file extension.
<<<<<<< HEAD
<<<<<<< HEAD
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
=======
=======
>>>>>>> a4365a5aafedcc4b8ba37961baddbdbfc8d46c1b
 */


/**/
var nfect = (function() {
  var _app = {
    cache: [],
    config: {
      calls: 0,
      default: 'index.html',
      error: null,
      header: {},
      log: null,
      method: null,
      request: null,
      response: null
    },
    nfect: {
      errorHead: '<!doctype html><html><head><meta charset="utf-8"></head><body>',
      errorTail: '</body></html>',
      loglevel: 2,
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
      resources: {
        fs: require('fs'),
        http: require('http'),
        url: require('url')
      },
      version: 'v0.2.3'
    }
  };

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
  })(_app.nfect.loglevel);

//debug start
  /*
   * __File = {
   *   file = 'index.html', // filename to serve
   *   header = {}, // object collection of headers to serve with file
   *   method = 'get', // method to accept ('get', 'post', 'both')
   *   status = 200 // HTTP status code to serve file under
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
//debug1
console.log('_app.calls:['+_app.config.calls+']descriptor['+descriptor+']');
    if(++_app.config.calls == 1) {
//debug1
console.log('first .add() call!');
      if(descriptor.file && descriptor.file !== null) {
//debug1
console.log('_app.config.defalt:['+_app.config.default+']');
        // yes, it's cool (http://es5.github.io/#x7.6)
        _app.config.default = descriptor.file;
      } else {
//debug1
console.log('_app.config.default:['+_app.config.default+']');
        descriptor.file = _app.config.default;
      }
      if(descriptor.method && descriptor.method !== null) {
//debug1
console.log('descriptor.method:['+descriptor.method+']');
      } else {
//debug1
console.log('descriptor.method:['+descriptor.method+']');
      }
    }
    if(descriptor.file && descriptor.file !== null) {
//debug1
console.log('pushing new __File()!');
//debug start
console.log('DESCRIPTOR:');
for(var prop in descriptor) {
  if(descriptor.hasOwnProperty(prop)) {
    console.log('property=>['+prop+']');
  }
}
//debug end
      _app.cache.push(new __File(descriptor));
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

/*
config: {
  calls: 0,
  default: 'index.html',
  error: null,
  header: null,
  log: null,
  method: null,
  request: null,
  response: null
}
*/

  var _config = function(descriptor) {
    _console.log('.config()');
    if(descriptor.default && descriptor.default !== null) {
      _app.config.default = descriptor.default;
    }
    if(descriptor.error && descriptor.error !== null) {
      _app.config.error = descriptor.error;
    }
    if(descriptor.header && descriptor.header !== null) {
      _app.config.header = descriptor.header;
    } else {
      _app.config.header = {};
    }
    if(descriptor.log && descriptor.log !== null) {
      _app.config.log = descriptor.log;
    }
    if(descriptor.method && descriptor.method !== null) {
      _app.config.method = descriptor.method;
    } else {
      _app.config.method = 'GET';
    }
    if(descriptor.request && descriptor.request !== null) {
      _app.config.request = descriptor.request;
    }
    if(descriptor.response && descriptor.response !== null) {
      _app.config.response = descriptor.response;
    }
    return this;
  };

  var _error = function(status, summary) {
    if(_app.config.log && _app.config.log !== null) {
      _log(status, summary);
    }
    // TODO FIX -- output stuff
    // method not yet implemented
  };

  var _generateRID = function(RIDLength) {
    var charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var rid = '';
    for(var i=0; i<RIDLength; i++) {
      rid += charset.substr(Math.random()*charset.length, 1);
    }
    return rid;
  };

  var _go = function() {
    if(_app.cache.length == 0) {
      _add({ method: 'GET' });
    }
    // default configuration
    _app.nfect.request.ID = _generateRID(_app.nfect.request.IDLength);
    // make sure we're the last function on the event queue
    setTimeout(_init(),0);
  };

//debug start
/*
    config: {
      calls: 0,
      default: 'index.html',
      error: null,
      header: null,
      log: null,
      method: null,
      request: null,
      response: null
    }
 */
//debug end

  var _init = function() {
    _console.log('_init()');
    // TODO FIX -- do some shit here!
    // general general configuration mismatch errors
    if(_app.config.method && _app.config.method !== null) {
      if(_app.config.request.method !== _app.config.method) {
        _error(413, "Method Not Supported");
        return false;
      }
    }
<<<<<<< HEAD
//debug1
console.log('_init():10');
//
//
// THIS IS NEXT DUDE
// basically search through all _app.cache __File() objects and see if 
// any of the .file matches the inbound request.url. IF NONE MATCH, then 
// you MUST fallback onto the default, whatever that is set to
//
//
//    var current = {};
//    for(var i=0; i>_app.cache.length; i++) {
//      if(_app.cache[i].file == _app.config.request.url) {
//        current = _app.cache[i];
//      }
//    }
//debug1
console.log('_app.cache:['+_app.cache+']_app.cache.len:['+_app.cache.length+']');
    _app.cache.forEach(function(file, index, cache) {
//debug start
console.log('CACHE OBJECT:');
for(var prop in file) {
  if(file.hasOwnProperty(prop)) {
    console.log('property=>['+prop+']');
  }
}
//debug end
//debug1
console.log('_init():15');
      // attempt to route
      if((_app.config.request.url !== file.file) && (index+1 < _app.cache.length)) {
//debug1
console.log('_init():20');
//debug1
console.log('_app.config.request.url:['+_app.config.request.url+']file.file:['+file.file+']');
        return false;
      } else {
//debug1
console.log('_init():25');
        // test for default-ness
        if(index == _app.cache.length) {
          var defaultFile = true;
        } else {
          var defaultFile = false;
        }
        _app.nfect.request.path = _app.nfect.resources.url.parse(_app.config.request.url).pathname;
        var fileType = _app.nfect.request.path.substr(_app.nfect.request.path.lastIndexOf('.')+1);
        var mimeType = _app.nfect.mime[fileType];
        if(mimeType && mimeType !== null) {
          _app.config.header['Content-Type'] = mimeType;
        } else {
          _app.config.header['Content-Type'] = 'text/plain';
        }
//debug1
=======
//debug1
console.log('_init():10');
//
//
// THIS IS NEXT DUDE
// basically search through all _app.cache __File() objects and see if 
// any of the .file matches the inbound request.url. IF NONE MATCH, then 
// you MUST fallback onto the default, whatever that is set to
//
//
//    var current = {};
//    for(var i=0; i>_app.cache.length; i++) {
//      if(_app.cache[i].file == _app.config.request.url) {
//        current = _app.cache[i];
//      }
//    }
//debug1
console.log('_app.cache:['+_app.cache+']_app.cache.len:['+_app.cache.length+']');
    _app.cache.forEach(function(file, index, cache) {
//debug start
console.log('CACHE OBJECT:');
for(var prop in file) {
  if(file.hasOwnProperty(prop)) {
    console.log('property=>['+prop+']');
  }
}
//debug end
//debug1
console.log('_init():15');
      // attempt to route
      if((_app.config.request.url !== file.file) && (index+1 < _app.cache.length)) {
//debug1
console.log('_init():20');
//debug1
console.log('_app.config.request.url:['+_app.config.request.url+']file.file:['+file.file+']');
        return false;
      } else {
//debug1
console.log('_init():25');
        // test for default-ness
        if(index == _app.cache.length) {
          var defaultFile = true;
        } else {
          var defaultFile = false;
        }
        _app.nfect.request.path = _app.nfect.resources.url.parse(_app.config.request.url).pathname;
        var fileType = _app.nfect.request.path.substr(_app.nfect.request.path.lastIndexOf('.')+1);
        var mimeType = _app.nfect.mime[fileType];
        if(mimeType && mimeType !== null) {
          _app.config.header['Content-Type'] = mimeType;
        } else {
          _app.config.header['Content-Type'] = 'text/plain';
        }
//debug1
>>>>>>> a4365a5aafedcc4b8ba37961baddbdbfc8d46c1b
console.log('_init():30');
        if(file.method && file.method !== null) {
          if(_app.config.request.method !== file.method) {
            _error(413, "Method Not Supported");
            return false;
          }
        }
//debug1
console.log('_init():40');
        if(_app.config.header && _app.config.header !== null) {
          for(header in _app.config.header) {
            if(_app.config.header.hasOwnProperty(header)) {
              file.header[header] = _app.config.header[header];
            }
          }
        }
        _out(file);
      }
    });
  };

  var _log = function(status, summary) {
    // TODO FIX -- log output
    // method not yet implemented
    _app.nfect.resources.fs.writeFile(_app.config.log, status+': '+summary, function(err) {
      if(err) _console.log(err);
    });
  };

  var _out = function(descriptor) {
    _console.log('_out()');
    if(_app.config.log && _app.config.log !== null) {
      _log(0, '_out()');
    }
    // TODO FIX -- output stuff
    // method not yet implemented
    _app.config.response.writeHead(status, summary, {'Content-Type': 'text/html'});
    _app.config.response.end(_app.data.errorHead+status+' '+summary+_app.data.errorTail);
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
<<<<<<< HEAD
>>>>>>> 171de254e2c1017bfd6b0888ccd70d5e7bb69799
=======
>>>>>>> a4365a5aafedcc4b8ba37961baddbdbfc8d46c1b

/* export module functions */
module.exports = nfect;
