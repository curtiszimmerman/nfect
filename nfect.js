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
  
  this.go = function(descriptor, callback) {
/*=*************** example descriptor object:*************************
descriptor = {['head.html','body.html','foot.html'],connection};
****************** example descriptor object:*************************
descriptor = {
  connection: {},
  files: ['head.html','body.html','foot.html'],
  fileHandle: {},
  outputType: 'html'
};
****************** example descriptor object:*************************
descriptor = {
  connection: {},
  files: [
    { name: 'db.js', process: false, type: 'js' },
    { name: 'results.js', process: true, type: 'js' },
    { name: 'footer.js', process: false, type: 'js' }
  ],
  fileHandle: {},
  outputType: 'js'
};
*********************************************************************/
    //debug1
    console.log('==== [NFECT] ('+_nfect.version+') initialize! ====');
    init();
    _nfect.type = Object.prototype.toString.call(descriptor);
    if(callback && typeof(callback) == 'function') {
      _nfect.callback = callback;
    }
    if(descriptor && descriptor.connection) {
    }
    _nfect.conn = connection;
    //debug2
    //_nfect.conn.writeHead(200, {'Content-Type': 'text/plain'});
    //_nfect.conn.write('GOSH DARN TEST!');
    if(_nfect.type === '[object Array]') {
      //debug1
      //console.log('*** [NFECT].(go) ROUTING TO [NFECT]->basic()');
      basic( descriptor );
    } else {
      //debug1
      //console.log('*** [NFECT].(go) ROUTING TO [NFECT]->advanced()');
      advanced( descriptor );
    }
  };
  
  // initialize the _nfect object
  this.init = function() {
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
  };
  
  // this function is used as a callback and then used as callback for chain of file processors
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
module.exports = { go:nfect.go };
