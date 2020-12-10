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
  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }

  function handleWSConnectionOverServicePort(servicePort, serviceName) {
    function portMessageToStringMessage(message) {
      if(message.buffer) {
        const s = ab2str(message.buffer)
        console.log(message.buffer, Buffer.from(s, 'binary'))
        const buffer  = Buffer.from(message.buffer).toString('base64')
        console.log('i2c message converted to ws string', buffer)
        return JSON.stringify({ ...message, buffer })
      }

      return JSON.stringify(message)
    }

    function stringMessageToPortMessage(message) {
        const encodedMsg = JSON.parse(message)

        const msg = encodedMsg
        if(msg.buffer) {
          const buf = Buffer.from(msg.buffer, 'base64')
            .toString()
            .split('')
            .map(b => b.charCodeAt(0))

          //console.log('decoding', buf)
          msg.buffer = Buffer.from(buf)
        }

        return msg
    }

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

    function handleWSMessageOverPort(port) {
      return message => postMessageOnPort(port, stringMessageToPortMessage(message))
    }

    function handleWSError(e) {
      console.log('ws error ', serviceName, e)
    }

    function handleWSCloseOverMessagePort(port) {
      return () => {
        console.log('ws close - close port to service', serviceName)
        port.close()
      }
    }

    function handlePortMessageOverWS(ws) {
      return message => ws.send(portMessageToStringMessage(message))
    }

    function handlePortCloseOverWS(ws) {
      return event => {
        console.log('client channel close', event)
        ws.close()
      }
    }

    // handleWSConnection
    return (ws, req) => {
      // inform the service of our intention to communicate
      const mc = new MessageChannel()
      servicePort.postMessage({ port: mc.port2 }, [ mc.port2 ])

      // setup WS handlers
      // these interact with the client webSocket using the creation
      // of a side-channel `mc` and acting as a proxy between
      ws.on('message', handleWSMessageOverPort(mc.port1))
      ws.on('error', handleWSError)
      ws.on('close', handleWSCloseOverMessagePort(mc.port1))

      // bind service handlers
      mc.port1.on('message', handlePortMessageOverWS(ws))
      mc.port1.on('close', handlePortCloseOverWS(ws))

      console.log('client connection to service established')
    }
  }

  function handleWSUpgrade(request, socket, head) {
    //const ip = req.headers['x-forwarded-for'].split(/\s*,\s*/)[0]
    //const ip = req.socket.remoteAddress
    const pathname = url.parse(request.url).pathname
    const protocols = request.headers['sec-websocket-protocol']
      ?.split(',')?.map(s => s.trim())
      ?? []

    console.log('path / protocols', pathname, protocols)

    if(!protocols.includes('i2c')) {
      console.log('no matching protocol - drop');
      // we could `socket.write()` but unknown what it should be (HTTP/1 header?)
      socket.destroy()
    }

    wsServer.handleUpgrade(request, socket, head, socket => {
      wsServer.emit('connection', socket, request)
    });
  }

  const serviceUrl = __dirname + '/service.js' // user path.concat
  const i2cWorker = new Worker(serviceUrl)
  i2cWorker.on('message', event => console.log('worker said', event))
  i2cWorker.on('exit', event => console.log('worker exit', event))

  const wsServer = new WebSocket.Server({ noServer: true })
  wsServer.on('connection', handleWSConnectionOverServicePort(i2cWorker, 'i2c'));
  server.on('upgrade', handleWSUpgrade)
}
