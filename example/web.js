const { Worker, MessageChannel } = require('worker_threads')

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

  const mc = new MessageChannel()
  i2cWorker.postMessage({ bus: 1, port: mc.port2 }, [ mc.port2 ])

  ws.on('message', async function incoming(message) {
    console.log('received', message);
    const msg = JSON.parse(message)
    mc.port1.postMessage(msg)
  });
  ws.on('error', e => console.log('error', e))
  ws.on('close', () => console.log('close'))

  mc.port1.on('message', message => {
    console.log('result', message)
    ws.send(JSON.stringify(message))
  })
});

const server = app.listen(9000, () => console.log('Service Up'))

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request);
  });
});
