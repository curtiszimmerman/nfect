/*
 * countdown server
 */

var http = require('http');
var testPort = 9999;

var server = http.createServer(function(req, res) {
  console.log('(NFECT-TEST.JS) [client '+req.connection.remoteAddress+':'+req.connection.remotePort+' initiated connection]');
  if(req.url == '/') {
    console.log('(NFECT-TEST.JS) from ['+req.connection.remoteAddress+':'+req.connection.remotePort+']');
    // begin nfect test
    console.log('(NFECT-TEST.JS) initializing nfect');
    var nfect = require('../nfect');
    nfect.go(res, ['./test/testhead.html','./test/testbody.html','./test/testfoot.html']);
  } else if(req.url == '/test.js') {
    var nfect = require('../nfect');
    nfect.go(res, ['./test/test.js']);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.write('(NFECT-TEST.JS) req.url['+req.url+']');
    res.end();
  }
}).listen(9999);
