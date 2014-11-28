NFECT
====
## (Node.js Front-End Construction Toolkit)

NFECT is a Node.js module for simple file output to the client. It uses 
JavaScript method chaining to indicate loading, execution, and 
code-inclusion details for external file and source code dependencies. 
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
var nfect = require('nfect');
var server = http.createServer(function(req, res) {
  nfect.config({
    request: req, response: res
  }).go();
}).listen(80);
```

The following Node.js example initializes an HTTP server that responds to 
requests for `index.html` using NFECT and a single method to build 
a multiple-page server using several different files. The method also 
specifies a custom `Expires` HTTP header for each of the files.

```javascript
var nfect = require('nfect');
var server = http.createServer(function(req, res) {
  nfect.config({
    request: req, response: res
  }).add({
    files: ['index.html','default.css','site.js'],
    header: {
      'Expires': 'Wed, 01 Jan 2014 16:00:00 GMT'
    }
  }).go();
}).listen(80);
```

Below is an NFECT example that constructs an HTTP server which responds to 
requests for `index.html` using NFECT's build utility to combine multiple
independent files into one output file. Compare this functionality to a 
more traditional `include()` function in other languages.

```javascript
var nfect = require('nfect');
var server = http.createServer(function(req, res) {
  nfect.config({
    request: req, response: res
  }).build({
    files: ['header.inc','body.html','footer.inc'],
    match: 'index.html'
  }).go();
}).listen(80);
```

## License

NFECT is (C) 2014 curtis zimmerman and released under GPLv3.
