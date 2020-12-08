const { Worker, MessageChannel } = require('worker_threads')
const url = require('url')

//const http = require('http')
const express = require('express')
const WebSocket = require('ws')
//const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan')

const app = express()
const MORGAN_EXT = ':status :method :url HTTP/:http-version  :remote-addr @ :response-time ms\x1b[0m'
app.use(morgan(MORGAN_EXT))
app.use('/', express.static('example/web'))
app.use((req, res, next) => next(new Error('🎁 ' + req.originalUrl)))

const server = app.listen(9000, () => console.log('Service Up'))

if(true) {
  const i2cWorker = new Worker(__dirname + '/service.js')
  i2cWorker.on('message', event => console.log('worker said', event))
  i2cWorker.on('exit', event => {
    console.log('worker exit', event)
    server.close()
  })

  const wsServer = new WebSocket.Server({ noServer: true });

  wsServer.on('connection', async function connection(ws, req) {

    const mc = new MessageChannel()
    i2cWorker.postMessage({ port: mc.port2 }, [ mc.port2 ])

    ws.on('message', async function incoming(message) {
      console.log('received: ', message);
      const encodedMsg = JSON.parse(message)

      const msg = encodedMsg
      if(msg.buffer) {
        console.log('decoding', Buffer.from(msg.buffer, 'base64').toString())
        msg.buffer = Buffer.from(msg.buffer, 'base64').toString()
      }

      console.log('received: ', msg);
      // validate client json
      if("type" in msg) {
        if(msg.buffer) {
          mc.port1.postMessage(msg, [ msg.buffer.buffer ])
        }
        else {
          mc.port1.postMessage(msg)
        }
      }
    });
    ws.on('error', e => console.log('error', e))
    ws.on('close', () => {
      console.log('close webSocket client connection')
      mc.port1.close()
    })

    mc.port1.on('message', message => {
      //console.log('encode message.buffer to base64', message.buffer)

      const msg = message
      if(msg.buffer !== undefined) {
        msg.buffer = Buffer.from(message.buffer).toString('base64')
      }

      console.log('sent: ', JSON.stringify(msg))
      ws.send(JSON.stringify(msg))
    })
    mc.port1.on('close', event => {
      console.log('client channel close')
      ws.close()
    })
  });

  server.on('upgrade', (request, socket, head) => {
    const protocols = request.headers['sec-websocket-protocol']
      ?.split(',')?.map(s => s.trim())
      ?? []

    const pathname = url.parse(request.url).pathname;
    console.log('path / protocols', pathname, protocols)
    if(!protocols.includes('i2c')) { console.log('no matching protocol - drop'); socket.destroy() }

    wsServer.handleUpgrade(request, socket, head, socket => {
      wsServer.emit('connection', socket, request);
    });
  })
}
