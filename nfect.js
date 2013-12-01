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
    cache: {},
    config: {
      call: 0,
      default: 'index.html',
      defaultData: false,
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
      requestID: null,
      requestIDLength: 12,
      resources: {
        fs: require('fs'),
        http: require('http'),
        url: require('url')
      },
      version: 'v0.2.0'
    }
  };

  var _add = function(descriptor) {
    if(++_app.call > 0 && descriptor.default && descriptor.default !== null) {
      _app.config.default = descriptor.default;
    }
    return this;
  };

  var _config = function(descriptor) {
    if(descriptor.default && descriptor.default !== null) {
      _app.config.default = descriptor.default;
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
    var requestPath = _app.nfect.resources.url.parse(_app.config.request.url).pathname;
    var fileType = requestPath.substr(requestPath.lastIndexOf('.')+1);
    _app.config.header['Content-Type'] = _app.nfect.mime[fileType];
    _app.nfect.requestID = _generateRID(_app.nfect.requestIDLength);
    // make sure we're the last function on the event queue
    setTimeout(_init(),0);
  };

  var _init = function() {
    _app.cache.forEach(function() {
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
