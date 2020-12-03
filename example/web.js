const http = require('http')
const express = require('express')
const ws = require('ws')
const WebSocket = require('ws')
//const { v4: uuidv4 } = require('uuid');

const app = express()
//app.get('/', (req, res) => {
//  res.json({ hello: 'world' })
//})

app.use('/', express.static('./'))

//const httpServer = http.createServer(router)
/*const wss = new WebSocket.Server({ server: httpServer })

wss.on('connection', function connection(ws, req) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  ws.send('{ test: true }');
});
*/
app.listen(9000)
