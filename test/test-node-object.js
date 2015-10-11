

var http = require('http');
var addr = '127.0.0.1',
  port = 9999,
  proto = 'http';

http.createServer(function (req, res) {
  // fuck your shit, motherfucker

  var inspect = res.connection.bytesRead;

  //console.log('SOMESHIT res.connection.server._connectionKey:['+res.connection.server._connectionKey+']');
  console.log('SOMESHIT inspect:['+inspect+']');


  for(var prop in inspect) {
    if(inspect.hasOwnProperty(prop)) {
      console.log('*** >>>>> PROPERTY OF ('+inspect._handle+') prop:['+prop+']');
    }
  }

  console.log('*** [END OF PRIMARY EXECUTION BLOCK] ***');
  
  res.end('Hello World\n');
}).listen(port, addr);

console.log('Server running at '+proto+'://'+addr+':'+port+'/');

/* ---- res.connection ACTUAL which is weird
]]]]]]]]]]]]]]] ==== [domain] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [_events] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [_maxListeners] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [output] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [outputEncodings] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [writable] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [_last] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [chunkedEncoding] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [shouldKeepAlive] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [useChunkedEncodingByDefault] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [sendDate] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [_hasBody] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [_trailer] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [finished] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [_hangupClose] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [socket] ==== [[[[[[[[[[[[[[[[[[
]]]]]]]]]]]]]]] ==== [connection] ==== [[[[[[[[[[[[[[[[[[
*/


/* ---- res
*** >>>>> PROPERTY OF ([object Object]) prop:[domain]
*** >>>>> PROPERTY OF ([object Object]) prop:[_events]
*** >>>>> PROPERTY OF ([object Object]) prop:[_maxListeners]
*** >>>>> PROPERTY OF ([object Object]) prop:[output]
*** >>>>> PROPERTY OF ([object Object]) prop:[outputEncodings]
*** >>>>> PROPERTY OF ([object Object]) prop:[writable]
*** >>>>> PROPERTY OF ([object Object]) prop:[_last]
*** >>>>> PROPERTY OF ([object Object]) prop:[chunkedEncoding]
*** >>>>> PROPERTY OF ([object Object]) prop:[shouldKeepAlive]
*** >>>>> PROPERTY OF ([object Object]) prop:[useChunkedEncodingByDefault]
*** >>>>> PROPERTY OF ([object Object]) prop:[sendDate]
*** >>>>> PROPERTY OF ([object Object]) prop:[_hasBody]
*** >>>>> PROPERTY OF ([object Object]) prop:[_trailer]
*** >>>>> PROPERTY OF ([object Object]) prop:[finished]
*** >>>>> PROPERTY OF ([object Object]) prop:[_hangupClose]
*** >>>>> PROPERTY OF ([object Object]) prop:[socket]
*** >>>>> PROPERTY OF ([object Object]) prop:[connection]
*/

/* ---- res.connection
*** >>>>> PROPERTY OF ([object Object]) prop:[_connecting]
*** >>>>> PROPERTY OF ([object Object]) prop:[_handle]
*** >>>>> PROPERTY OF ([object Object]) prop:[_readableState]
*** >>>>> PROPERTY OF ([object Object]) prop:[readable]
*** >>>>> PROPERTY OF ([object Object]) prop:[domain]
*** >>>>> PROPERTY OF ([object Object]) prop:[_events]
*** >>>>> PROPERTY OF ([object Object]) prop:[_maxListeners]
*** >>>>> PROPERTY OF ([object Object]) prop:[_writableState]
*** >>>>> PROPERTY OF ([object Object]) prop:[writable]
*** >>>>> PROPERTY OF ([object Object]) prop:[allowHalfOpen]
*** >>>>> PROPERTY OF ([object Object]) prop:[onend]
*** >>>>> PROPERTY OF ([object Object]) prop:[destroyed]
*** >>>>> PROPERTY OF ([object Object]) prop:[errorEmitted]
*** >>>>> PROPERTY OF ([object Object]) prop:[bytesRead]
*** >>>>> PROPERTY OF ([object Object]) prop:[_bytesDispatched]
*** >>>>> PROPERTY OF ([object Object]) prop:[_pendingData]
*** >>>>> PROPERTY OF ([object Object]) prop:[_pendingEncoding]
*** >>>>> PROPERTY OF ([object Object]) prop:[server]
*** >>>>> PROPERTY OF ([object Object]) prop:[_idleTimeout]
*** >>>>> PROPERTY OF ([object Object]) prop:[_idleNext]
*** >>>>> PROPERTY OF ([object Object]) prop:[_idlePrev]
*** >>>>> PROPERTY OF ([object Object]) prop:[_idleStart]
*** >>>>> PROPERTY OF ([object Object]) prop:[parser]
*** >>>>> PROPERTY OF ([object Object]) prop:[ondata]
*** >>>>> PROPERTY OF ([object Object]) prop:[_httpMessage]
*/

/* ---- res.connection._events
*** >>>>> PROPERTY OF (undefined) prop:[end]
*** >>>>> PROPERTY OF (undefined) prop:[finish]
*** >>>>> PROPERTY OF (undefined) prop:[_socketEnd]
*** >>>>> PROPERTY OF (undefined) prop:[drain]
*** >>>>> PROPERTY OF (undefined) prop:[timeout]
*** >>>>> PROPERTY OF (undefined) prop:[error]
*** >>>>> PROPERTY OF (undefined) prop:[close]
*/

/* ---- res.connection._handle
*** >>>>> PROPERTY OF ([object TCP]) prop:[fd]
*** >>>>> PROPERTY OF ([object TCP]) prop:[writeQueueSize]
*** >>>>> PROPERTY OF ([object TCP]) prop:[onconnection]
*** >>>>> PROPERTY OF ([object TCP]) prop:[owner]
*/

/* ---- res.connection._handle.owner
*** >>>>> PROPERTY OF ([object TCP]) prop:[_connecting]
*** >>>>> PROPERTY OF ([object TCP]) prop:[_handle]
*** >>>>> PROPERTY OF ([object TCP]) prop:[_readableState]
*** >>>>> PROPERTY OF ([object TCP]) prop:[readable]
*** >>>>> PROPERTY OF ([object TCP]) prop:[domain]
*** >>>>> PROPERTY OF ([object TCP]) prop:[_events]
*** >>>>> PROPERTY OF ([object TCP]) prop:[_maxListeners]
*** >>>>> PROPERTY OF ([object TCP]) prop:[_writableState]
*** >>>>> PROPERTY OF ([object TCP]) prop:[writable]
*** >>>>> PROPERTY OF ([object TCP]) prop:[allowHalfOpen]
*** >>>>> PROPERTY OF ([object TCP]) prop:[onend]
*** >>>>> PROPERTY OF ([object TCP]) prop:[destroyed]
*** >>>>> PROPERTY OF ([object TCP]) prop:[errorEmitted]
*** >>>>> PROPERTY OF ([object TCP]) prop:[bytesRead]
*** >>>>> PROPERTY OF ([object TCP]) prop:[_bytesDispatched]
*** >>>>> PROPERTY OF ([object TCP]) prop:[_pendingData]
*** >>>>> PROPERTY OF ([object TCP]) prop:[_pendingEncoding]
*** >>>>> PROPERTY OF ([object TCP]) prop:[server]
*** >>>>> PROPERTY OF ([object TCP]) prop:[_idleTimeout]
*** >>>>> PROPERTY OF ([object TCP]) prop:[_idleNext]
*** >>>>> PROPERTY OF ([object TCP]) prop:[_idlePrev]
*** >>>>> PROPERTY OF ([object TCP]) prop:[_idleStart]
*** >>>>> PROPERTY OF ([object TCP]) prop:[parser]
*** >>>>> PROPERTY OF ([object TCP]) prop:[ondata]
*** >>>>> PROPERTY OF ([object TCP]) prop:[_httpMessage]
*/

/* ---- res.connection.parser [[object HTTPParser]]
*** >>>>> PROPERTY OF (undefined) prop:[_headers]
*** >>>>> PROPERTY OF (undefined) prop:[_url]
*** >>>>> PROPERTY OF (undefined) prop:[onHeaders]
*** >>>>> PROPERTY OF (undefined) prop:[onHeadersComplete]
*** >>>>> PROPERTY OF (undefined) prop:[onBody]
*** >>>>> PROPERTY OF (undefined) prop:[onMessageComplete]
*** >>>>> PROPERTY OF (undefined) prop:[socket]
*** >>>>> PROPERTY OF (undefined) prop:[incoming]
*** >>>>> PROPERTY OF (undefined) prop:[maxHeaderPairs]
*** >>>>> PROPERTY OF (undefined) prop:[onIncoming]
*/

/* ---- res.connection.server
*** >>>>> PROPERTY OF ([object Object]) prop:[domain]
*** >>>>> PROPERTY OF ([object Object]) prop:[_events]
*** >>>>> PROPERTY OF ([object Object]) prop:[_maxListeners]
*** >>>>> PROPERTY OF ([object Object]) prop:[_connections]
*** >>>>> PROPERTY OF ([object Object]) prop:[connections]
*** >>>>> PROPERTY OF ([object Object]) prop:[_handle]
*** >>>>> PROPERTY OF ([object Object]) prop:[_usingSlaves]
*** >>>>> PROPERTY OF ([object Object]) prop:[_slaves]
*** >>>>> PROPERTY OF ([object Object]) prop:[allowHalfOpen]
*** >>>>> PROPERTY OF ([object Object]) prop:[httpAllowHalfOpen]
*** >>>>> PROPERTY OF ([object Object]) prop:[timeout]
*** >>>>> PROPERTY OF ([object Object]) prop:[_connectionKey]
*/

/* ---- res.connection.server._handle
*** >>>>> PROPERTY OF ([object TCP]) prop:[fd]
*** >>>>> PROPERTY OF ([object TCP]) prop:[writeQueueSize]
*** >>>>> PROPERTY OF ([object TCP]) prop:[onconnection]
*** >>>>> PROPERTY OF ([object TCP]) prop:[owner]
*/

/* ---- res.socket
*** >>>>> PROPERTY OF ([object Object]) prop:[_connecting]
*** >>>>> PROPERTY OF ([object Object]) prop:[_handle]
*** >>>>> PROPERTY OF ([object Object]) prop:[_readableState]
*** >>>>> PROPERTY OF ([object Object]) prop:[readable]
*** >>>>> PROPERTY OF ([object Object]) prop:[domain]
*** >>>>> PROPERTY OF ([object Object]) prop:[_events]
*** >>>>> PROPERTY OF ([object Object]) prop:[_maxListeners]
*** >>>>> PROPERTY OF ([object Object]) prop:[_writableState]
*** >>>>> PROPERTY OF ([object Object]) prop:[writable]
*** >>>>> PROPERTY OF ([object Object]) prop:[allowHalfOpen]
*** >>>>> PROPERTY OF ([object Object]) prop:[onend]
*** >>>>> PROPERTY OF ([object Object]) prop:[destroyed]
*** >>>>> PROPERTY OF ([object Object]) prop:[errorEmitted]
*** >>>>> PROPERTY OF ([object Object]) prop:[bytesRead]
*** >>>>> PROPERTY OF ([object Object]) prop:[_bytesDispatched]
*** >>>>> PROPERTY OF ([object Object]) prop:[_pendingData]
*** >>>>> PROPERTY OF ([object Object]) prop:[_pendingEncoding]
*** >>>>> PROPERTY OF ([object Object]) prop:[server]
*** >>>>> PROPERTY OF ([object Object]) prop:[_idleTimeout]
*** >>>>> PROPERTY OF ([object Object]) prop:[_idleNext]
*** >>>>> PROPERTY OF ([object Object]) prop:[_idlePrev]
*** >>>>> PROPERTY OF ([object Object]) prop:[_idleStart]
*** >>>>> PROPERTY OF ([object Object]) prop:[parser]
*** >>>>> PROPERTY OF ([object Object]) prop:[ondata]
*** >>>>> PROPERTY OF ([object Object]) prop:[_httpMessage]
*/

/* ---- res.socket.server
*** >>>>> PROPERTY OF ([object Object]) prop:[domain]
*** >>>>> PROPERTY OF ([object Object]) prop:[_events]
*** >>>>> PROPERTY OF ([object Object]) prop:[_maxListeners]
*** >>>>> PROPERTY OF ([object Object]) prop:[_connections]
*** >>>>> PROPERTY OF ([object Object]) prop:[connections]
*** >>>>> PROPERTY OF ([object Object]) prop:[_handle]
*** >>>>> PROPERTY OF ([object Object]) prop:[_usingSlaves]
*** >>>>> PROPERTY OF ([object Object]) prop:[_slaves]
*** >>>>> PROPERTY OF ([object Object]) prop:[allowHalfOpen]
*** >>>>> PROPERTY OF ([object Object]) prop:[httpAllowHalfOpen]
*** >>>>> PROPERTY OF ([object Object]) prop:[timeout]
*** >>>>> PROPERTY OF ([object Object]) prop:[_connectionKey]
*/
