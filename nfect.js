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
* NOTE: without connection, nfect returns output as string
********************* example descriptor object:*************************
descriptor = {
  connection: {},
  files: ['head.html','body.html','foot.html'],
  fileHandle: {},
  headers: [{'Expires':''}],
  output: 'html',
  status: 200
};
********************* example descriptor object:*************************
descriptor = {
  connection: {},
  files: [
    { name: 'db.js', process: false, type: 'js' },
    { name: 'results.js', process: true, type: 'js' },
    { name: 'footer.js', process: false, type: 'js' }
  ],
  fileHandle: {},
  headers: [{'Expires':''}],
  output: 'plain',
  status: 200
};
************************************************************************/
 
var nfect = (function() {

  // internal data object
  var _nfect = { };
  // data subobject is how we encapsulate and transport data to files
  var data = { };
    
  //required modules
  var EventEmitter = require('events').EventEmitter;
  var fs = require('fs');
  // error eventemitter (obviously)
  var errorEvent = new EventEmitter();
  // object initialized eventemitter
  var initEvent = new EventEmitter();
  // object parsed eventemitter
  var parseEvent = new EventEmitter();
  errorEvent.on('error', function(num, msg) {
    _nfect.type = 'error';
    _nfect.error = true;
    _nfect.errorNumber = num;
    _nfect.errorMessage = msg;
    error();
  });
  
  // pub/sub/unsub pattern utility functions
  var pubsub = (function() {
    // pub/sub/unsub pattern cache
    var cache = { };
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
      pub:_pub,
      sub:_sub,
      unsub:_unsub
    };
  }());
  
  /* advanced() handles complex descriptor object instructions */
  // FIX DEAR GOD FIX this to handle Other Things
  function advanced() {
    //debug3
    console.log('[NFECT].(advanced).start!');
    console.log('============== WARNING =================');
    console.log('[NFECT].(advanced) IS NOT IMPLEMENTED!');
    //debug start
    for(var file in files) {
      if(files.hasOwnProperty(file)) {
        console.log('[NFECT].(advanced).descriptor.prop:['+prop+']');
      }
    }
    //debug end
    if(files.length == 0) {
      //debug1
      //console.log('*** [NFECT].(advanced) END CONNECTION');
      _nfect.conn.end();
      if(out && typeof(out) == 'function') {
        out();
      }
    } else {
      advanced( descriptor, files.shift() );
    }
  };
  
  //todo set up eventemitter for fileRead.complete() to trigger out()
  function basic() {
    var filesLength = _nfect.files.length,
      filesRead = 0;
    var contentStorage = [];
    var fileHandle = pubsub.sub('/nfect/input/file', function(position, content) {
      filesRead++;
      contentStorage[position] = content;
      // preserve input file order
      if(filesRead === filesLength) {
        for(var i=0; i<filesLength; i++) {
          _nfect.output.content.push(contentStorage[i]);
        }
        pubsub.pub('/nfect/processed');
      }
    });
    for(var i=0; i<filesLength; i++) {
      // pass iterator into closure
      (function(iteration) {
//debug1
console.log('000 [NFECT] -=-=-=-=-=-=-=- i['+i+'] files[i]:['+_nfect.files[iteration]+']');
        var nextFile = _nfect.files[iteration];
        //FIX -- these are going to be put onto the stack and potentially 
        //taken off in some random order. you need to push onto an array 
        //to preserve the order intended by client
        fs.readFile(nextFile, 'utf8', function(err, contents) {
//debug1
console.log('===--->>> [NFECT].(basic) FIRST DUMP OF FILE:['+contents+']');
          if(err) {
            pubsub.pub('/nfect/error',[1,'File Read Error: ['+err+']']);
            return;
          } else {
//debug1
console.log('[NFECT] =-=-=-=-=-=->>>>>> for shats and grans: i['+iteration+']');
            pubsub.pub('/nfect/input/file',[iteration,contents]);
            return;
          }
        });
      }(i));
    }
  };
  
  // fire up the _nfect storage object
  function form(args) {
    _nfect = {
      args: args,
      callback: {},
      conn: {},
      descriptor: {},
      error: {
        message: '',
        number: 0
      },
      files: [],
      output: {
        display: false,
        content: []
      },
      process: 'basic',
      state: {
        initialized: false,
        parse: false
      },
      type: '',
      version: 'v0.1.1'
    };
    pubsub.pub('/nfect/formed');
  };
  
  // initialize the _nfect object
  function init() {
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
          pubsub.pub('/nfect/error',[2,'Syntax Error: Malformed Descriptor: Argument Type']);
          return;
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
          pubsub.pub('/nfect/error',[3,'Syntax Error: Malformed Descriptor: Argument Type']);
          return;
        }
        break;
      default:
        pubsub.pub('/nfect/error',[4,'Syntax Error: Malformed Descriptor: Argument Number']);
        return;
    }
    if(!descriptor) {
      pubsub.pub('/nfect/error',[5,'Syntax Error: Malformed Descriptor: Missing']);
      return;
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
        pubsub.pub('/nfect/error',[6,'Syntax Error: Malformed Descriptor: Improper Type']);
        return;
    }
    if(callback && typeof(callback) == 'function') {
      _nfect.callback = callback;
    }
    //fix -- properly detect connection
    if(connection && typeof(connection) == 'object') {
      _nfect.conn = connection;
      _nfect.output.display = true;
    }
    _nfect.state.initialized = true;
    // trigger initialized event handler
    pubsub.pub('/nfect/initialized');
  };
  
  //utility function for determining emptiness of object
  function isEmpty(obj) {
    for(var prop in obj) {
      if(obj.hasOwnProperty(prop)) return false;
    }
    return true;
  };
  
  //todo return output instead of writing output to connection
  function out() {
//debug1
console.log('*** [NFECT].(out).writing!:['+_nfect.output.content+'] output.display['+_nfect.output.display+']');
    if(_nfect.output.display === false) {
      return _nfect.output.content.join('');
    } else {
      var output = _nfect.output.content.join('');
      _nfect.conn.writeHead(200, { 'Content-Length': output.length, 'Content-Type': 'text/html' });
      _nfect.conn.write(output);
      _nfect.conn.end();
    }
  };
  
  function parse() {
    if(_nfect.state.parse) {
      if(!isEmpty(_nfect.descriptor) && _nfect.descriptor.files && _nfect.descriptor.files.length > 0) {
        _nfect.files = _nfect.descriptor.files;
      } else {
        pubsub.pub('/nfect/error',[7,'Syntax Error: Descriptor Empty']);
        return;
      }
    }
    pubsub.pub('/nfect/parsed');
  };
  
  function nfect() {
    var errorHandle = pubsub.sub('/nfect/error', function(num, msg) {
      _nfect.type = 'error';
      _nfect.error.number = num;
      _nfect.error.message = msg;
      if(_nfect.conn && typeof(_nfect.conn) === 'object' && !isEmpty(_nfect.conn)) {
        _nfect.conn.writeHead(500, { 'Content-Type': 'text/plain' });
        _nfect.conn.write('Error '+_nfect.error.number+': '+_nfect.error.message);
        _nfect.conn.end();
      } else {
        return 'Error '+_nfect.error.number+': '+_nfect.error.message;
      }
    });
    var formHandle = pubsub.sub('/nfect/formed', function() {
//debug1
console.log('[NFECT].nfect().formHandle ***** HERE *****');
      init();
    });
    var initHandle = pubsub.sub('/nfect/initialized', function() {
//debug1
console.log('[NFECT].nfect().initHandle ***** HERE *****');
      parse();
    });
    var parseHandle = pubsub.sub('/nfect/parsed', function() {
//debug1
console.log('[NFECT].nfect().parseHandle ***** HERE *****');
      if(_nfect.type === 'array' || _nfect.type === 'string') {
         basic();
       } else if(_nfect.type === 'object') {
         advanced();
       }
    });
    var processHandle = pubsub.sub('/nfect/processed', function() {
      out();
    });
    // formalize arguments array
    var args = Array.prototype.slice.call(arguments);
    // guarantee ourselves this gets tossed onto event loop
    setTimeout(form(args),0);
  };
  
  // expose nfect
  return {
    data: data,
    nfect: nfect
  };
}());

/* export module functions */
module.exports = nfect.nfect;
