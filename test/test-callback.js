

var http = require('http');
var addr = '127.0.0.1',
  port = 9999,
  proto = 'http';

http.createServer(function (req, res) {
  // fuck your shit, motherfucker
  
  // tester function
  var tester = function(bullshit, callback) {
    console.log('[tester] BEGIN bullshit:['+bullshit+']');
    if(callback && typeof(callback) === 'function') {
      callback.apply(this, [bullshit, arguments]);
    }
  };
  tester('foo',function(parameter_one, parameter_two) {
    console.log('[tester] CALLBACK p1:['+parameter_one+'] p2:['+parameter_two+']');
  });

  console.log('*** [END OF PRIMARY EXECUTION BLOCK] ***');
  
  res.end('Hello World\n');
}).listen(port, addr);

console.log('Server running at '+proto+'://'+addr+':'+port+'/');
