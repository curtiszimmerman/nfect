/*
 * countdown server
 */

var http = require('http');
var testPort = 9999;

var server = http.createServer(function(req, res) {
  console.log('(NFECT-TEST.JS) [client '+req.connection.remoteAddress+':'+req.connection.remotePort+' initiated connection]');
  if(req.url == '/') {
    console.log('(NFECT-TEST.JS) from ['+req.connection.remoteAddress+':'+req.connection.remotePort+']');
    var nfect = require('../nfect');
    nfect(['./test/testhead.html','./test/testbody.html','./test/testfoot.html'], res);
  } else if(req.url == '/test.js') {
    console.log('(NFECT-TEST.JS) from ['+req.connection.remoteAddress+':'+req.connection.remotePort+']');
    var nfect = require('../nfect');
    nfect(['./test/test.js'], res);
  } else if(req.url == '/test2.js') {
    var nfect = require('../nfect');
    var output = nfect(['./test/test2.js']);
//debug1
console.log('[NFECT-TEST.JS].req.url == test.js output:['+output+']');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write(output);
    res.end();
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.write('(NFECT-TEST.JS) req.url['+req.url+']');
    res.end();
  }
}).listen(9999);
