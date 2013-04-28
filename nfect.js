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
  //init error eventemitter
  var errorEvent = new EventEmitter();
  errorEvent.on('error', function(num, msg) {
    _nfect.type = 'error';
    _nfect.error = true;
    _nfect.errorNumber = num;
    _nfect.errorMessage = msg;
    error();
  });
  
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
    //debug1
    console.log('[NFECT] ONEONEONE-=-=-=-=-=-=-=- filesLength['+filesLength+'] filesRead:['+filesRead+']');
    //init readfiles eventemitter 
    var fileEvent = new EventEmitter();
    fileEvent.on('readfile', function() {
      //debug1
      console.log('[NFECT] TWOTWOTWO-=-=-=-=-=-=-=- filesLength['+filesLength+'] filesRead:['+filesRead+']');
      //if all of our files have been read in, launch output handler
      filesRead++;
      if(filesRead === filesLength) {
        if(out && typeof(out) == 'function') { out(); }
      }
    });
    //decrement towards zero is faster and will evaluate to true when i==0
    for(var i=0; i<filesLength; i++) {
//debug1
console.log('000 [NFECT] -=-=-=-=-=-=-=- i['+i+'] files[i]:['+_nfect.files[i]+']');
      var nextFile = _nfect.files[i];
//debug1
console.log('000 [NFECT].(basic) nextFile:['+nextFile+']');
      //FIX -- these are going to be put onto the stack and potentially 
      //taken off in some random order. you need to push onto an array 
      //to preserve the order intended by client
      fs.readFile(nextFile, 'utf8', function(err, contents) {
//debug1
console.log('===--->>> [NFECT].(basic) FIRST DUMP OF FILE:['+contents+']');
        if(err) {
          errorEvent.emit('error',1,'File Read Error: ['+err+']');
          return;
        } else {
//debug1
console.log('[NFECT] =-=-=-=-=-=->>>>>> for shats and grans: i['+i+']');
          _nfect.outputText.push(contents);
          //increment output handler
          fileEvent.emit('readfile');
        }
      });
    }
  };
  
  // handle error event emission
  function error() {
    if(_nfect.conn && typeof(_nfect.conn) === 'object' && !isEmpty(_nfect.conn)) {
      _nfect.conn.writeHead(500, { 'Content-Type': 'text/plain' });
      _nfect.conn.write('Error: '+_nfect.errorMessage);
      _nfect.conn.end();
    } else {
      return 'Error '+_nfect.errorNumber+': '+_nfect.errorMessage;
    }
  };
  
  // fire up the _nfect storage object
  function form() {
    _nfect = {
      args: 0,
      callback: {},
      conn: {},
      descriptor: {},
      error: false,
      errorMessage: '',
      errorNumber: 0,
      files: [],
      initialized: false,
      output: false,
      outputText: [],
      process: 'basic',
      type: '',
      version: 'v0.1.1'
    }
  };
  
  // initialize the _nfect object
  function init(arguments) {
    var argsLength = arguments.length,
      descriptor = {},
      callback = {},
      connection = {};
    _nfect.args = argsLength;
    //parse arguments and behave accordingly
    switch(argsLength) {
      case 1:
        descriptor = arguments[0];
        break;
      case 2:
        descriptor = arguments[0];
        if(typeof(arguments[1]) === 'function') {
          callback = arguments[1];
        } else if(typeof(arguments[1]) === 'object') {
          connection = arguments[1];
        } else {
          errorEvent.emit('error',2,'Syntax Error: Malformed Descriptor: Argument Type');
          return;
        }
        break;
      case 3:
        descriptor = arguments[0];
        if(typeof(arguments[1]) === 'object' && typeof(arguments[2]) === 'function') {
          connection = arguments[1];
          callback = arguments[2];
        } else if(typeof(arguments[1]) === 'function' && typeof(arguments[1]) === 'object') {
          callback = arguments[1];
          connection = arguments[2];
        } else {
          errorEvent.emit('error',3,'Syntax Error: Malformed Descriptor: Argument Type');
          return;
        }
        break;
      default:
        errorEvent.emit('error',4,'Syntax Error: Malformed Descriptor: Argument Number');
        return;
    }
    if(!descriptor) {
      errorEvent.emit('error',5,'Syntax Error: Malformed Descriptor: Missing');
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
        parse();
        break;
      case '[object String]':
        _nfect.type = 'string';
        _nfect.files.push(descriptor);
        break;
      default:
        errorEvent.emit('error',6,'Syntax Error: Malformed Descriptor: Improper Type');
        return;
    }
    if(callback && typeof(callback) == 'function') {
      _nfect.callback = callback;
    }
    //fix -- properly detect connection
    if(connection && typeof(connection) == 'object') {
      _nfect.conn = connection;
    } else {
      _nfect.output = true;
    }
    _nfect.initialized = true;
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
    console.log('*** [NFECT].(out).writing!:['+_nfect.outputText+']');
    //fix -- this needs to be properly constructed first
    var outputTextLength = _nfect.outputText.length;
    if(_nfect.output === true) {
      //fix -- this needs to return outputText.join('') or something
      return _nfect.outputText.join('');
    } else {
      //fix -- this needs to reflect true size of output text
      var output = _nfect.outputText.join('');
      _nfect.conn.writeHead(200, { 'Content-Length': output.length, 'Content-Type': 'text/html' });
      _nfect.conn.write(output);
      _nfect.conn.end();
    }
  };
  
  function parse(descriptor) {
    if(!isEmpty(descriptor) && descriptor.files && descriptor.files.length > 0) {
      _nfect.files = descriptor.files;
    } else {
      errorEvent.emit('error',7,'Syntax Error: Descriptor Empty');
      return;
    }
  };
  
  function nfect() {
    form();
    init(arguments);
    if(_nfect.type === 'array' || _nfect.type === 'string') {
      basic();
    } else if(_nfect.type === 'object') {
      advanced();
    }
  };
  
  //return nfect
  return {
    data: data,
    nfect: nfect
  };
}());

/* export module functions */
module.exports = nfect.nfect;
