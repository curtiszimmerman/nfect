/*
 * NFECT test/showcase
 */

var http = require('http');
var testPort = 9999;

var server = http.createServer(function(req, res) {
  ////////////// basic default config()
  console.log('(NFECT-TEST.JS) from ['+req.connection.remoteAddress+':'+req.connection.remotePort+']');
  var nfect = require('../nfect');
  nfect.config({
    response: res,
    request: req
  }).go();
  ////////////// build()
  //} else {
  ////////////// default
  //}
}).listen(9999);
