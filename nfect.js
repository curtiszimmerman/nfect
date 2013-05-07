/*
 *  nfect.js -- web front-end constructor
 *  pass in an object describing the files and their function and 
 *  nfect outputs it properly to the client
 */
 
/*
 * var outputString = nfect.go( <string input> );
 * var outputString = nfect.go( <string input>, function callback() );
 * nfect.go( <string input>, {object connection} );
 * var outputString = nfect.go( [array inputFiles] );
 * var outputString = nfect.go( {object descriptor} );
 * EXAMPLES:
 * var output = nfect.go( 'file.html' );
 * var output = nfect.go( 'file.html', callback() );
 * var output = nfect.go( {descriptor} );
 * nfect.go( 'file.html', {connection} );
 * nfect.go( ['file.html'], {connection} );
 * nfect.go( ['file1.html', 'file2.html'], {connection} );
 * nfect.go( {descriptor}, {connection} );
 * nfect.go( {descriptor}, {connection}, callback() );
 * NOTES: 
 * -- without connection, nfect returns output as string
 * -- connection specified, nfect automatically applies these headers:
 *  'Content-Type': 'text/' + [output type] (default depends on extension)
 *  'Content-Length': [calculated length of output]
 *  - status code is specified (default is 200)
 * -- on error reading ANY file, nfect aborts operation and only outputs 
 *   information about the error
 * -- nfect attempts to calculate the output type based on extension and 
 *   some rudimentary analytics, especially with simplified descriptors
 * SUGGESTED OPERATION:
 * -- in array of files, use string-literals to specify vanilla html and 
 *   provide files you want pre-processed by nfect (with code that is 
 *   specified with <?nfect and ?> tags, for example) in the array as 
 *   objects with only the filename specified as a string. see below for 
 *   example.
 * -- initialize http.createServer object and specify as second argument 
 *   to nfect.go function
********************* example descriptor object:*************************
* example: ['head.html',{'db.js'},'body.html','foot.html'], connection;
********************* example descriptor object:*************************
descriptor = {
  files: ['head.html','body.html','foot.html'],
  headers: {'Expires':'4','Poop':0},
  output: 'html',
  status: 200
};
********************* example descriptor object:*************************
descriptor = {
  files: [
    { name: 'db.js', process: false, type: 'js' },
    { name: 'results.js', process: true, type: 'js' },
    { name: 'footer.js', process: false, type: 'js' }
  ],
  headers: {'Expires':'4','Poop':0},
  output: 'plain',
  status: 200
};
************************************************************************/
 
var nfect = (function() {

  // internal data object
  var _nfect = { };
  
  // pub/sub/unsub pattern utility functions
  var _pubsub = (function() {
    // pub/sub/unsub pattern cache
    var cache = { };
    function _flush() {
      cache = { };
    };
    function _pub(topic, args, scope) {
      if(cache[topic]) {
        var currentTopic = cache[topic],
          topicLength = currentTopic.length;
        for(var i=0; i<topicLength; i++) {
          currentTopic[i].apply(scope || this, args || []);
        }
      }
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
    };
    return {
      flush:_flush,
      pub:_pub,
      sub:_sub,
      unsub:_unsub
    };
  }());
  
  // fire up the _nfect storage object
  function _form(args) {
    _nfect = {
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
      //// output status code, output type (html/plain)
      output: {
        display: false,
        content: [],
        headers: {},
        status: 200,
        type: 'html'
      },
      // processing state
      state: {
        parse: false,
        process: []
      },
      // input descriptor type
      type: '',
      // nfect version
      version: 'v0.1.3'
    };
    _pubsub.pub('/nfect/formed');
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
        _nfect.state.parse = true;
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
  
  //todo return output instead of writing output to connection
  function _out() {
//debug1
console.log('*** [NFECT].(out).writing!:['+_nfect.output.content+'] output.display['+_nfect.output.display+']');
    if(_nfect.output.display === true) {
      var output = _nfect.output.content.join('');
      // add content-length to our headers
      _nfect.output.headers['Content-Length'] = output.length;
      _nfect.conn.writeHead(200, _nfect.output.headers);
      _nfect.conn.write(output);
      _nfect.conn.end();
    }
    _pubsub.pub('/nfect/callback');
  };
  
  function _parse() {
    var plain = true,
      process = false;
    if(_nfect.state.parse) {
      if(!_isEmpty(_nfect.descriptor) && _nfect.descriptor.files && _nfect.descriptor.files.length > 0) {
        // copy descriptor files array to nfect storage array
        _nfect.files = _nfect.descriptor.files;
        // override process setting
        process = true;
      } else {
        _pubsub.pub('/nfect/error',[7,'Syntax Error: Descriptor Empty']);
        return false;
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
    } else {
      // toggle this local variable to false if content type == html
    }
    var filesLength = _nfect.files.length,
      regex = /\.html/i;
    for(var i=0; i<filesLength; i++) {
      // find file process specifiers or override process setting
      var file = _nfect.files[i];
      if(process === true) {
        _nfect.state.process[i] = true;
        continue;
      }
      if(typeof(file) === '[object Object]') {
        for(var piece in file) {
          if(typeof(piece) === '[object String]') {
            _nfect.files[i] = piece;
          } else {
            _pubsub.pub('/nfect/error',[7,'Syntax Error: Malformed Descriptor: Files Array']);
            return false;
          }
        }
      } else {
        _nfect.state.process[i] = false;
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
    var formHandle = _pubsub.sub('/nfect/formed', function() {
      _init();
    });
    var initHandle = _pubsub.sub('/nfect/initialized', function() {
      _parse();
    });
    var parseHandle = _pubsub.sub('/nfect/parsed', function() {
      _readFiles();
    });
    var readHandle = _pubsub.sub('/nfect/files/read', function() {
      _process();
    });
    var processHandle = _pubsub.sub('/nfect/files/processed', function() {
      _out();
    });
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
