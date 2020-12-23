/* eslint-disable no-inner-declarations */
import { Worker, MessageChannel } from 'worker_threads'
import { performance, PerformanceObserver } from 'perf_hooks'
import { Buffer } from 'buffer'
// import { console } from 'console'

import url from 'url'

//const http = require('http')
import express from 'express'
import WebSocket from 'ws'
//const { v4: uuidv4 } = require('uuid');
import morgan from 'morgan'

const hostOnly = process.argv.includes('--hostOnly')
const MORGAN_EXT = ':status :method :url HTTP/:http-version  :remote-addr @ :response-time ms\x1b[0m'

const app = express()
  .use(morgan(MORGAN_EXT))
  .use('/', express.static('example/web'))
  .use((req, res, next) => { req.path === '/favicon.ico' ? res.status(200).end() : next() })
  .use((req, res, next) => next(new Error('🎁 ' + req.originalUrl)))

const server = app.listen(9000, () => console.log('Service Up'))

const enableEncoding = true

if(!hostOnly) {
  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }

  class MessageTransform {
    static portMessageToStringMessage(message) {
      if(message.buffer) {
        if(!enableEncoding) { return JSON.stringify({ ...message, buffer: message.buffer.toString() }) }

        const s = ab2str(message.buffer)
        console.log(message.buffer, Buffer.from(s, 'binary'))
        const buffer  = Buffer.from(message.buffer).toString('base64')
        //console.log('i2c message converted to ws string', buffer)
        return JSON.stringify({ ...message, buffer })
      }

      return JSON.stringify(message)
    }

    static stringMessageToPortMessage(message) {
        const encodedMsg = JSON.parse(message)

        const msg = encodedMsg
        if(msg.buffer) {
          if(!enableEncoding) { msg.buffer = msg.buffer.split(',').map(y => parseInt(y, 10)); return msg }

          const buf = Buffer.from(msg.buffer, 'base64')
            .toString()
            .split('')
            .map(b => b.charCodeAt(0))

          msg.buffer = Buffer.from(buf)
        }

        return msg
    }
  }

  function handleWSConnectionOverServicePort(servicePort, serviceName) {
    function handleWSMessageOverPort(port) {
      function postMessageOnPort(port, msg) {
        if(msg.type !== undefined) {
          if(enableEncoding && msg.buffer) {
            //console.log(' RAW WS MESSAGE [transfer]', msg)
            port.postMessage(msg, [ msg.buffer.buffer ])
          }
          else {
            //console.log(' RAW WS MESSAGE', msg)
            port.postMessage(msg)
          }
        }
      }

      return message => {
        performance.mark('WS:Message:Start')
        postMessageOnPort(port, MessageTransform.stringMessageToPortMessage(message))
        performance.mark('WS:Message:End')
        performance.measure('WS:Message', 'WS:Message:Start', 'WS:Message:End')
      }
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
      return message => {
        performance.mark()
        ws.send(MessageTransform.portMessageToStringMessage(message))
        performance.mark()
      }
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


  function handleWSUpgradeOverWSServer(wsServer) {
    return (request, socket, head) => {
      const ip = request.headers['x-forwarded-for']?.split(/\s*,\s*/)[0]
      const raw_ip = request.socket.remoteAddress

      const pathname = url.parse(request.url).pathname
      const protocols = request.headers['sec-websocket-protocol']
        ?.split(',')?.map(s => s.trim())
        ?? []

      console.log('path / protocols', pathname, protocols, ip, raw_ip)

      if(!protocols.includes('i2c')) {
        console.log('no matching protocol - drop');
        // we could `socket.write()` but unknown what it should be (HTTP/1 header?)
        socket.destroy()
      }

      wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request)
      })
    }
  }

  const serviceUrl = './example/service-worker.js'
  const i2cWorker = new Worker(serviceUrl, {
    //name: 'I2C',
    //type: 'module',
    //credentials: 'same-origin'
  })

  i2cWorker.on('message', event => console.log('worker said', event))
  i2cWorker.on('error', event => console.log('worker error', event))
  i2cWorker.on('exit', event => console.log('worker exit', event))

  const i2cWSServer = new WebSocket.Server({ noServer: true })
  i2cWSServer.on('connection', handleWSConnectionOverServicePort(i2cWorker, 'i2c'));
  server.on('upgrade', handleWSUpgradeOverWSServer(i2cWSServer))

  const o = new PerformanceObserver((list, observer) => {
    console.log('⏱ observations: ', list.getEntriesByType('measure').map(ob => ob.name + ' ' + ob.duration))
  })
  o.observe({ buffered: true, entryTypes: [ 'measure' ] })

}
