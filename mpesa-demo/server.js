const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Serve index.html for all requests
  const filePath = path.join(__dirname, 'index.html');
  const content = fs.readFileSync(filePath);
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(content);
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
