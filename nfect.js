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
  if(descriptor.hasOwnProperty(prop) {
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

/* export module functions */
module.exports = nfect;
