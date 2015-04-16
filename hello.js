var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hellow sdfafefWorld\n');
}).listen(process.env.PORT, process.env.IP);
