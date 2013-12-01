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
 */


/**/
var nfect = (function() {
  var _app = {
    cache: [],
    config: {
      calls: 0,
      default: 'index.html',
      error: null,
      header: null,
      log: null,
      request: null,
      response: null
    },
    nfect: {
      errorHead: '<!doctype html><html><head><meta charset="utf-8"></head><body>',
      errorTail: '</body></html>',
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
      version: 'v0.2.1'
    }
  };

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
    if(++_app.calls == 1) {
      if(_app.config.default && _app.config.default !== null) {
         if(descriptor.default && descriptor.default !== null) {
        _app.config.default = descriptor.default;
      }
    }
    if(descriptor.file && descriptor.file !== null) {
      var entity = {
        file: descriptor.file;
      };
      _app.cache.push(new __File(descriptor));
    } else if(descriptor.files && descriptor.files !== null) {
      var files = descriptor.files.slice();
      delete descriptor.files;
      files.forEach(function(file) {
        var descriptorCopy = {};
        for(var key in descriptor) {
          if(descriptor.hasOwnProperty(key)) {
            descriptorCopy[key] = descriptor[key];
          }
        }
        descriptorCopy.file = file;
        _add(descriptorCopy);
      });
    }
    return this;
  };

  var _build = function(descriptor) {
    // method not implemented yet
    return this;
  };

  var _config = function(descriptor) {
    if(descriptor.default && descriptor.default !== null) {
      _app.config.default = descriptor.default;
    }
    if(descriptor.error && descriptor.error !== null) {
      _app.config.error = descriptor.error;
    }
    if(descriptor.header && descriptor.header !== null) {
      _app.config.header = descriptor.header;
    }
    if(descriptor.log && descriptor.log !== null) {
      _app.config.log = descriptor.log;
    }
    if(descriptor.request && descriptor.request !== null) {
      _app.config.request = descriptor.request;
    }
    if(descriptor.response && descriptor.response !== null) {
      _app.config.response = descriptor.response;
    }
    return this;
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
    // default configuration
    _app.nfect.request.path = _app.nfect.resources.url.parse(_app.config.request.url).pathname;
    var fileType = _app.nfect.request.path.substr(requestPath.lastIndexOf('.')+1);
    _app.config.header['Content-Type'] = _app.nfect.mime[fileType];
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
      request: null,
      response: null
    }
 */
//debug end

  var _init = function() {
    _app.cache.forEach(function() {
      if(_app.config.request.
    });
  };

  var _log = function() {
  };

  var _out = function(status, summary) {
    
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

/* export module functions */
module.exports = nfect.nfect;
