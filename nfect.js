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
  
  /* advanced() handles complex descriptor object instructions */
  // FIX DEAR GOD FIX this to handle Other Things
  function _advanced() {
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
      if(_out && typeof(_out) == 'function') {
        _out();
      }
    } else {
      _advanced( descriptor, files.shift() );
    }
  };
  
  //todo set up eventemitter for fileRead.complete() to trigger out()
  function _basic() {
    var filesLength = _nfect.files.length,
      filesRead = 0,
      fs = require('fs');
    var contentStorage = [];
    var fileHandle = _pubsub.sub('/nfect/input/file', function(position, content) {
      filesRead++;
//debug1
console.log('_____________________________________inside readFile trigger:content:['+content+']');
      contentStorage[position] = content;
      // preserve input file order
      if(filesRead === filesLength) {
        for(var i=0; i<filesLength; i++) {
          _nfect.output.content.push(contentStorage[i]);
        }
        _pubsub.pub('/nfect/processed');
        return;
      }
    });
    for(var i=0; i<filesLength; i++) {
      // pass iterator into closure
      (function(iteration) {
//debug1
console.log('000 [NFECT] -=-=-=-=-=-=-=- iter['+iteration+'] files[iter]:['+_nfect.files[iteration]+']');
        var nextFile = _nfect.files[iteration];
        //FIX -- NONDISPLAY RETURN data is not functioning correctly. it doesn't 
        // return any data, and doesn't appear to trigger the following readFile()
        fs.readFile(nextFile, 'utf8', function(err, contents) {
//debug1
console.log('===--->>> [NFECT].(basic) FIRST DUMP OF FILE:['+contents+']');
          if(err) {
            _pubsub.pub('/nfect/error',[1,'File Read Error: ['+err+']']);
            return false;
          } else {
//debug1
console.log('[NFECT] =-=-=-=-=-=->>>>>> for shats and grans: i['+iteration+']');
            _pubsub.pub('/nfect/input/file',[iteration,contents]);
          }
        });
      }(i));
    }
  };
  
  // fire up the _nfect storage object
  function _form(args) {
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
        parse: false
      },
      type: '',
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
    // sanity check connection object by testing bytesRead
    if(connection && typeof(connection) == 'object' && connection.bytesRead >= 0) {
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
      _nfect.conn.writeHead(200, { 'Content-Length': output.length, 'Content-Type': 'text/html' });
      _nfect.conn.write(output);
      _nfect.conn.end();
    }
    _pubsub.pub('/nfect/callback');
  };
  
  function _parse() {
    if(_nfect.state.parse) {
      if(!_isEmpty(_nfect.descriptor) && _nfect.descriptor.files && _nfect.descriptor.files.length > 0) {
        _nfect.files = _nfect.descriptor.files;
      } else {
        _pubsub.pub('/nfect/error',[7,'Syntax Error: Descriptor Empty']);
        return false;
      }
    }
    _pubsub.pub('/nfect/parsed');
  };
  
  function nfect() {
    _nfect = { };
    _pubsub.flush();
    var errorHandle = _pubsub.sub('/nfect/error', function(num, msg) {
      _nfect.type = 'error';
      _nfect.error.number = num;
      _nfect.error.message = msg;
      if(_nfect.conn && typeof(_nfect.conn) === 'object' && !_isEmpty(_nfect.conn)) {
        _nfect.conn.writeHead(500, { 'Content-Type': 'text/plain' });
        _nfect.conn.write('Error '+_nfect.error.number+': '+_nfect.error.message);
        _nfect.conn.end();
      } else {
        console.log('Error '+_nfect.error.number+': ['+_nfect.error.message+']');
      }
      // initiate callback with error
      if(_nfect.callback && typeof(_nfect.callback) === 'function') {
        _nfect.callback.apply(this, 'Error '+_nfect.error.number+': ['+_nfect.error.message+']');
      }  
    });
    var formHandle = _pubsub.sub('/nfect/formed', function() {
//debug1
console.log('[NFECT].nfect().formHandle ***** HERE *****');
      _init();
    });
    var initHandle = _pubsub.sub('/nfect/initialized', function() {
//debug1
console.log('[NFECT].nfect().initHandle ***** HERE *****');
      _parse();
    });
    var parseHandle = _pubsub.sub('/nfect/parsed', function() {
//debug1
console.log('[NFECT].nfect().parseHandle ***** HERE *****');
      if(_nfect.type === 'array' || _nfect.type === 'string') {
        _basic();
      } else if(_nfect.type === 'object') {
        _advanced();
      }
    });
    var processHandle = _pubsub.sub('/nfect/processed', function() {
      _out();
    });
    var callbackHandle = _pubsub.sub('/nfect/callback', function() {
      // initiate callback
      if(_nfect.callback && typeof(_nfect.callback) === 'function') {
        console.log('[NFECT] Initiating callback with output');
        _nfect.callback.apply(this, _nfect.output.content.join(''));
      }
    });
    // formalize arguments array
    var args = Array.prototype.slice.call(arguments);
    // guarantee ourselves this gets tossed onto event loop
    setTimeout(_form(args),0);
  };
  
  // expose nfect
  return {
    data: data,
    nfect: nfect
  };
}());

/* export module functions */
module.exports = nfect.nfect;
