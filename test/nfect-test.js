/*
 * NFECT test/showcase
 */

var http = require('http');
var testPort = 9999;

var server = http.createServer(function(req, res) {
  if(req.url == '/') {
  ////////////// index
    console.log('(NFECT-TEST.JS) from ['+req.connection.remoteAddress+':'+req.connection.remotePort+']');
    var nfect = require('../nfect');
    nfect(['./test/testhead.html','./test/testbody.html','./test/testfoot.html'], res);
  } else if(req.url == '/test.js') {
  ////////////// test.js
    console.log('(NFECT-TEST.JS) from ['+req.connection.remoteAddress+':'+req.connection.remotePort+']');
    var nfect = require('../nfect');
    var output = nfect('./test/test.js', res);
  } else if(req.url == '/test2.js') {
  ////////////// test2.js -- output redirect and error tests
    console.log('(NFECT-TEST.JS) from ['+req.connection.remoteAddress+':'+req.connection.remotePort+']');
    var nfect = require('../nfect');
    nfect('./test/test2.js', function(error, output) {
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
  ////////////// test3.js -- data pass test
    console.log('(NFECT-TEST.JS) from ['+req.connection.remoteAddress+':'+req.connection.remotePort+']');
    var nfect = require('../nfect');
    nfect({
        data: { client:'abcd0123' },
        files:['./test/test3.js'],
        headers:{ 'Expires': 'Wed, 01 Jan 2014 16:00:00 GMT' },
        process:true,
        status: 200
      }, res);
  } else {
  ////////////// default
    console.log('(NFECT-TEST.JS) from ['+req.connection.remoteAddress+':'+req.connection.remotePort+']');
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.write('(NFECT-TEST.JS) req.url['+req.url+']');
    res.end();
  }
}).listen(9999);
