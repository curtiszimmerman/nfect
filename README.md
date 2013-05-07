NFECT (Node.js Front-End Construction Tool)
====

NFECT is a Node.js module for simple file output to the client. It uses 
JavaScript to specify a "descriptor" to indicate loading, execution, 
and code-inclusion details for external file and source code dependencies. 
The vision is to provide a mechanism for front-end developers to easily 
incorporate many dependencies (such as common header and footer HTML files, 
CSS files, and client-side JavaScript files) without needing to learn and 
use special content markup or awkward design patterns. NFECT also allows 
a developer to safely pass data via the descriptor object to and between 
each of these dependencies.

## Usage

## Examples

The following Node.js code initializes a simple HTTP server that responds 
to all requests using NFECT to output an `index.html` file to the client.

```javascript
var server = http.createServer(function(req, res) {
  var nfect = require('../nfect');
  nfect('./index.html', res);
}).listen(80);
```

The following Node.js example initializes an HTTP server that responds to 
requests for `index.html` using NFECT and a simple descriptor to build 
a single output file from several input files. The descriptor also 
specifies a custom `Expires` HTTP header for caching purposes.

```javascript
var server = http.createServer(function(req, res) {
  if(req.url == '/index.html') {
    var nfect = require('../nfect');
    nfect({
      files: ['./header.html','./body.html','./footer.html'],
      headers: { 'Expires': 'Wed, 01 Jan 2014 16:00:00 GMT' }
    });
  }
}).listen(80);
```

## License

NFECT is released under the BSD License (version 3).
