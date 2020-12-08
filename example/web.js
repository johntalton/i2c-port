const { Worker, MessageChannel } = require('worker_threads')
const url = require('url')

//const http = require('http')
const express = require('express')
const WebSocket = require('ws')
//const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan')


const hostOnly = process.argv.includes('--hostOnly')
const MORGAN_EXT = ':status :method :url HTTP/:http-version  :remote-addr @ :response-time ms\x1b[0m'

const app = express()
  .use(morgan(MORGAN_EXT))
  .use('/', express.static('example/web'))
  .use((req, res, next) => { req.path === '/favicon.ico' ? res.status(200).end() : next() })
  .use((req, res, next) => next(new Error('🎁 ' + req.originalUrl)))

const server = app.listen(9000, () => console.log('Service Up'))

if(!hostOnly) {

  function postMessageOnPort(port, msg) {
    if(msg.type !== undefined) {
      if(msg.buffer) {
        port.postMessage(msg, [ msg.buffer.buffer ])
      }
      else {
        port.postMessage(msg)
      }
    }
  }

  function createI2cWorker(serviceUrl) {
    const i2cWorker = new Worker(serviceUrl)
    i2cWorker.on('message', event => console.log('worker said', event))
    i2cWorker.on('exit', event => {
      console.log('worker exit', event)
      // TODO server.close()
    })
  }

  const serviceUrl = __dirname + 'service.js' // user path.concat
  const i2cWorker = createI2cWorker(serviceUrl)

  const wsServer = new WebSocket.Server({ noServer: true });

  wsServer.on('connection', async function connection(ws, req) {

    const mc = new MessageChannel()
    i2cWorker.postMessage({ port: mc.port2 }, [ mc.port2 ])

    ws.on('message', async message => {
      console.log('ws to i2c: ', message);
      const msg = stringMessageToPortMessage(message)
      postMessageOnPort(mc.port1, msg)
    })

    ws.on('error', e => console.log('ws error', e))

    ws.on('close', () => {
      console.log('ws close - close port to i2c')
      mc.port1.close()
    })

    mc.port1.on('message', message => {
      const msg = portMessageToStringMessage(message)
      ws.send(msg)
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
