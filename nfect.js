/*
 *  nfect.js -- web front-end constructor
 *  pass in an object describing the files and their function and 
 *  nfect outputs it properly to the client
 */
 
var nfect = function() {
  this._nfect = {};
  
  /* advanced() handles complex descriptor object instructions */
  this.advanced = function( descriptor, files ) {
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
  
  this.basic = function( files ) {
    //debug1
    //console.log('[NFECT].(basic).start!');
    if(files.length == 0) {
      //debug1
      //console.log('*** [NFECT].(basic) END CONNECTION');
      if(out && typeof(out) == 'function') {
        out();
      }
    } else {
      var nextFile = files.shift();
      //debug1
      //console.log('*** [NFECT].(basic) BEGIN DUMP OF FILE:['+nextFile+']');
      var fs = require('fs');
      fs.readFile(nextFile, 'utf8', function(err, contents) {
        //debug1
        //console.log('*** [NFECT].(basic) CONTENTS OF FILE:['+contents+']');
        if(err) {
          _nfect.error = true;
          _nfect.errorMessage = err;
          return;
        } else {
          _nfect.output.push( contents );
        }
        basic( files );
      });
    }
  };
  
  this.data = {};
  
  this.go = function() {
/*
 * nfect.go() USAGE:
 * nfect.go(descriptor, [connection]);
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
descriptor =/= ['head.html',{'db.js'},'body.html','foot.html'], connection;
* NOTE: without connection, nfect returns output as string
********************* example descriptor object:*************************
descriptor = {
  connection: {},
  files: ['head.html','body.html','foot.html'],
  fileHandle: {},
  headers: [{'Expires':''}],
  outputType: 'html',
  statusCode: 200
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
  outputType: 'plain',
  statusCode: 200
};
************************************************************************/
    //debug1
    console.log('==== [NFECT] ('+_nfect.version+') initialize! ====');
    // parse descriptor into _nfect
    init( arguments );
    //debug2
    //_nfect.conn.writeHead(200, {'Content-Type': 'text/plain'});
    //_nfect.conn.write('GOSH DARN TEST!');
    if(_nfect.type === 'array') {
      //debug1
      //console.log('*** [NFECT].(go) ROUTING TO [NFECT]->basic()');
      basic( descriptor );
    } else if(_nfect.type === 'string') {
      //debug1
      //console.log('*** [NFECT].(go) ROUTING TO [NFECT]->basic()');
      basic( descriptor );
    } else if(_nfect.type === 'object') {
      //debug1
      //console.log('*** [NFECT].(go) ROUTING TO [NFECT]->advanced()');
      advanced( descriptor );
    }
  };
  
  // initialize the _nfect object
  this.init = function(descriptor, callback) {
    this._nfect = {
      callback: {},
      conn: {},
      error: false,
      errorMessage: '',
      files: [],
      output: [],
      type: '',
      version: 'v0.1.0'
    };
    var descriptor = {},
      callback = {},
      connection = {},
      predictedType = '';
    //parse arguments and behave accordingly
    if(arguments.length === 1) {
      descriptor = arguments[0];
    } else if(arguments.length === 2) {
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
    } else if(arguments.length === 3) {
      descriptor = arguments[0];
      if(typeof(arguments[1]) === 'object') {
        connection = arguments[1];
      } else {
        _nfect.type = 'error';
        _nfect.error = true;
        _nfect.errorMessage = 'Syntax Error: Malformed Descriptor: Argument Type';
      }
      if(typeof(arguments[2]) === 'function') {
        callback = arguments[2];
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
      } else if(type === '[object Object]') {
        _nfect.type = 'object';
      } else if(type === '[object String]') {
        _nfect.type = 'string';
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
    if(!descriptor) {
      _nfect.type = 'error';
      _nfect.error = true;
      _nfect.errorMessage = 'Syntax Error: Malformed Descriptor: Missing';
    }
    if(callback && typeof(callback) == 'function') {
      _nfect.callback = callback;
    }
    //fix -- properly detect connection
    if(descriptor.connection) {
      _nfect.conn = descriptor.connection;
    } else {
    }
  };
  
  //todo set up eventemitter for .on('error')
  //todo return output instead of writing output to connection
  this.out = function() {
    //debug1
    //console.log('*** [NFECT].(out).start!');
    if(_nfect.error) {
      _nfect.conn.writeHead(500, { 'Content-Type': 'text/plain' });
      _nfect.conn.write('Error opening file: '+_nfect.errorMessage);
      _nfect.conn.end();
    } else {
      var outlen = _nfect.output.length;
      var body = _nfect.output.join('');
      //debug1
      //console.log('*** [NFECT].(out).writing!:['+body+']');
      _nfect.conn.writeHead(200, { 'Content-Length': body.length, 'Content-Type': 'text/html' });
      _nfect.conn.write(body);
      _nfect.conn.end();
    }
  };
  
  return {
    data: data,
    go: go
  }
}();

/* export module functions */
module.exports = {
  data: nfect.data,
  go: nfect.go
};
