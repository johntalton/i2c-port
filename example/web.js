const { Worker } = require('worker_threads')

//const http = require('http')
const express = require('express')
const WebSocket = require('ws')
//const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan')

const i2cWorker = new Worker(__dirname + '/service.js')
i2cWorker.onmessage = event => console.log('worker said', event)

const app = express()
const MORGAN_EXT = ':status :method :url HTTP/:http-version  :remote-addr @ :response-time ms\x1b[0m'
app.use(morgan(MORGAN_EXT))
app.use('/', express.static('example/web'))
app.use((req, res, next) => next(new Error('🎁 ' + req.originalUrl)))

const wsServer = new WebSocket.Server({ noServer: true });

wsServer.on('connection', async function connection(ws, req) {
  ws.on('message', async function incoming(message) {
    console.log('received: %s', message);
    i2cWorker.postMessage(message)
  });
  ws.on('error', e => {})
  ws.on('close', e => {})
});

const server = app.listen(9000, () => console.log('Service Up'))

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request);
  });
});
