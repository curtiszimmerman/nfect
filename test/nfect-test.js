/*
 * countdown server
 */

var http = require('http');
var testPort = 9999;

var server = http.createServer(function(req, res) {
  console.log('(NFECT-TEST.JS) [client '+req.connection.remoteAddress+':'+req.connection.remotePort+' initiated connection]');
  if(req.url == '/') {
  ////////////// index
    console.log('(NFECT-TEST.JS) from ['+req.connection.remoteAddress+':'+req.connection.remotePort+']');
    var nfect = require('../nfect');
    nfect.go(['./test/testhead.html','./test/testbody.html','./test/testfoot.html'], res);
  } else if(req.url == '/test.js') {
  ////////////// test.js
    console.log('(NFECT-TEST.JS) from ['+req.connection.remoteAddress+':'+req.connection.remotePort+']');
    var nfect = require('../nfect');
    var output = nfect.go('./test/test.js', res);
  } else if(req.url == '/test2.js') {
  ////////////// test2.js
    var nfect = require('../nfect');
    nfect.go('./test/test2.js', function(error, output) {
      if(error) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write(error);
        res.end();
      } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write(output);
        res.end();
      }
    });
  } else if(req.url == '/test3.js') {
  ////////////// data pass test
    var nfect = require('../nfect');
    nfect.data = { test: 'test' };
    nfect.go();
  } else {
  ////////////// default
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.write('(NFECT-TEST.JS) req.url['+req.url+']');
    res.end();
  }
}).listen(9999);
