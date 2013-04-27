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
  //debug1 -- proof positive that your setup is bullshit
  console.log('======> nfect() this['+this+'] typeof(this)['+typeof(this)+']');

  _nfect = {
    args: 0,
    callback: {},
    conn: {},
    descriptor: {},
    error: false,
    errorMessage: '',
    files: [],
    initialized: false,
    output: false,
    outputText: '',
    process: 'basic',
    type: '',
    version: 'v0.1.1'
  };
  
  /* advanced() handles complex descriptor object instructions */
  function advanced() {
    //debug2
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
  
  function basic() {
    var filesLength = _nfect.files.length;
    for(var i=0; i<filesLength; i++) {
      //debug1
      console.log('-=-=-=-=-=-=-=- i['+i+'] files[i]:['+_nfect.files[i]+']');
      var nextFile = _nfect.files[i],
        fs = require('fs');
      //debug1
      console.log('*** [NFECT].(basic) fs?['+fs+']');
      fs.readFile(nextFile, 'utf8', function(err, contents) {
        //debug1
        console.log('*** [NFECT].(basic) CONTENTS OF FILE:['+contents+']');
        if(err) {
          _nfect.error = true;
          _nfect.errorMessage = err;
          return;
        } else {
          //debug1
          console.log('*** [NFECT].(basic) BEGIN DUMP OF FILE:['+contents+']');
          _nfect.outputText = _nfect.outputText + contents;
        }
      });
    }
    if(out && typeof(out) == 'function') {
      out();
    }
  };
  
  // data subobject is how we encapsulate and transport data to files
  var data = { };
  
  // initialize the _nfect object
  //FIX -- GOOD GOD GET RID OF THIS ERROR-ASSIGNING MONSTROSITY
  function init(arguments) {
    //debug1 -- proof positive that your setup is bullshit
    console.log('======> nfect.init() this['+this+'] typeof(this)['+typeof(this)+']');
    _nfect = {
      args: 0,
      callback: {},
      conn: {},
      descriptor: {},
      error: false,
      errorMessage: '',
      files: [],
      initialized: false,
      output: false,
      process: 'basic',
      type: '',
      version: 'v0.1.0'
    };
    var argsLength = arguments.length,
      descriptor = {},
      callback = {},
      connection = {};
    _nfect.args = argsLength;
    //parse arguments and behave accordingly
    if(argsLength === 1) {
      descriptor = arguments[0];
    } else if(argsLength === 2) {
      descriptor = arguments[0];
      if(typeof(arguments[1]) === 'function') {
        callback = arguments[1];
      } else if(typeof(arguments[1]) === 'object') {
        connection = arguments[1];
      } else {
        _nfect.type = 'error';
        _nfect.error = true;
        _nfect.errorMessage = 'Syntax Error: Malformed Descriptor: Argument Type';
      }
    } else if(argsLength === 3) {
      descriptor = arguments[0];
      if(typeof(arguments[1]) === 'object' && typeof(arguments[2]) === 'function') {
        connection = arguments[1];
        callback = arguments[2];
      } else if(typeof(arguments[1]) === 'function' && typeof(arguments[1]) === 'object') {
        callback = arguments[1];
        connection = arguments[2];
      } else {
        _nfect.type = 'error';
        _nfect.error = true;
        _nfect.errorMessage = 'Syntax Error: Malformed Descriptor: Argument Type';
      }
    } else {
      _nfect.type = 'error';
      _nfect.error = true;
      _nfect.errorMessage = 'Syntax Error: Malformed Descriptor: Argument Number';
    }
    var type = Object.prototype.toString.call(descriptor);
    if(type) {
      if(type === '[object Array]') {
        _nfect.type = 'array';
        _nfect.files = descriptor;
      } else if(type === '[object Object]') {
        _nfect.type = 'object';
        parse();
      } else if(type === '[object String]') {
        _nfect.type = 'string';
        _nfect.files.push = descriptor;
      } else {
        _nfect.type = 'error';
        _nfect.error = true;
        _nfect.errorMessage = 'Syntax Error: Malformed Descriptor: Improper Type';
      }
    } else {
      _nfect.type = 'error';
      _nfect.error = true;
      _nfect.errorMessage = 'Syntax Error: Malformed Descriptor: Missing';
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
  
  //todo set up eventemitter for .on('error')
  //todo return output instead of writing output to connection
  function out() {
    //debug1
    //console.log('*** [NFECT].(out).start!');
    if(_nfect.error) {
      _nfect.conn.writeHead(500, { 'Content-Type': 'text/plain' });
      _nfect.conn.write('Error opening file: '+_nfect.errorMessage);
      _nfect.conn.end();
    } else {
      if(_nfect.output === true) {
        return _nfect.outputText;
      } else {
        //debug1
        //console.log('*** [NFECT].(out).writing!:['+body+']');
        _nfect.conn.writeHead(200, { 'Content-Length': _nfect.outputText.length, 'Content-Type': 'text/html' });
        _nfect.conn.write(body);
        _nfect.conn.end();
      }
    }
  };
  
  function parse(descriptor) {
    if(descriptor.files && descriptor.files.length > 0) {
      _nfect.files = descriptor.files;
    } else {
    }
  };
  
  function nfect() {
    //debug1
    console.log('==== [NFECT] ('+_nfect.version+') initialize! ====');
    // parse descriptor into _nfect
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
