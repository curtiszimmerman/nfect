

var http = require('http');
var addr = '127.0.0.1',
  port = 9999,
  proto = 'http';

http.createServer(function (req, res) {
  // fuck your shit, motherfucker
  var EE = require('events').EventEmitter;
  var ee = new EE();
  var die = false;

  // listener
  ee.on('die', function() {
    die = true;
  });

  // force function onto event stack
  /* DELAYED */
  setTimeout(function() {
    console.log('[setTimeout:1] BEGIN (should be on top of (execute after) primary block)');
    if(die) {
      console.log('[setTimeout:1]TRUE');
    } else {
      console.log('[setTimeout:1]FALSE');
    }
  },0);

  // event emission
  /* DELAYED */
  setTimeout(function() {
    ee.emit('die');
  }, 0);

  // module pattern
  /* IMMEDIATE */
  (function() {
    console.log('[module] BEGIN (should execute within primary block)');
    if(die) {
      console.log('[module]TRUE');
    } else {
      console.log('[module]FALSE');
    }
  }());

  // tester function
  /* IMMEDIATE */
  var tester = function() {
    console.log('[tester] BEGIN (should execute within primary block)');
    if(die) {
      console.log('[tester]TRUE');
    } else {
      console.log('[tester]FALSE');
    }
  };
  tester();
  
  // force function onto event stack
  /* DELAYED */
  setTimeout(function() {
    console.log('[setTimeout:2] BEGIN (should be on top of (execute after) setTimeout1 and primary block)');
    if(die) {
      console.log('[setTimeout:2]TRUE');
    } else {
      console.log('[setTimeout:2]FALSE');
    }
  },0);

  console.log('*** [END OF PRIMARY EXECUTION BLOCK] ***');
  
  res.end('Hello World\n');
}).listen(port, addr);

console.log('Server running at '+proto+'://'+addr+':'+port+'/');
