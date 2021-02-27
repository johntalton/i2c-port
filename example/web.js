/* eslint-disable no-inner-declarations */
import { Worker, MessageChannel } from 'worker_threads'
import { performance, PerformanceObserver } from 'perf_hooks'
// import { console } from 'console'

import url from 'url'

// const http = require('http')
import express from 'express'
import WebSocket from 'ws'
// const { v4: uuidv4 } = require('uuid');
import morgan from 'morgan'

import { MessageTransform } from './message-transform.js'

const hostOnly = process.argv.includes('--hostOnly')
const MORGAN_EXT = ':status :method :url HTTP/:http-version  :remote-addr @ :response-time ms\x1b[0m'

const app = express()
  .use(morgan(MORGAN_EXT))
  .use('/', express.static('example/web', { extensions: ['js'] }))
  .use((req, res, next) => { if(req.path === '/favicon.ico') { res.status(200).end(); return } next() })
  .use((req, res, next) => next(new Error('🎁 ' + req.originalUrl)))

const server = app.listen(9000, () => console.log('Service Up'))


if(!hostOnly) {


  function handleWSConnectionOverServicePort(servicePort, serviceName) {
    function handleWSMessageOverPort(port) {
      function postMessageOnPort(port, msg) {
        if(msg.type !== undefined) {
          if(msg.buffer !== undefined) {
            // console.log(' RAW WS MESSAGE [transfer]', msg)
            port.postMessage(msg, [ msg.buffer ])
          }
          else {
            //console.log(' RAW WS MESSAGE', msg)
            port.postMessage(msg)
          }
        }
      }

      return message => {
        performance.mark('WS:Message:Start')
        postMessageOnPort(port, MessageTransform.decodeMessage(message))
        performance.mark('WS:Message:End')
        performance.measure('WS:Message', 'WS:Message:Start', 'WS:Message:End')
      }
    }

    function handleWSError(e) {
      console.warn('ws error ', serviceName, e)
    }

    function handleWSCloseOverMessagePort(port) {
      return () => {
        console.log('ws close - close port to service', serviceName)
        port.close()
      }
    }

    function handlePortMessageOverWS(ws) {
      return message => {
        performance.mark('Port:Message:Start')
        ws.send(MessageTransform.encodeMessage(message))
        performance.mark('Port:Message:End')
        performance.measure('Port:Message', 'Port:Message:Start', 'Port:Message:End')
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
        ?.split(',')?.map(s => s.trim()) ?? []

      console.log('path / protocols', pathname, protocols, ip, raw_ip)

      if(!protocols.includes('i2c')) {
        console.warn('no matching protocol - drop')
        // we could `socket.write()` but unknown what it should be (HTTP/1 header?)
        socket.destroy()
      }

      wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request)
      })
    }
  }

  const serviceUrl = './example/i2c-script-worker.js' // './example/service-worker.js'
  const i2cWorker = new Worker(serviceUrl, {
    // name: 'I2C',
    // type: 'module',
    // credentials: 'same-origin'
  })

  i2cWorker.on('message', event => console.log('worker said', event))
  i2cWorker.on('error', event => console.warn('worker error', event))
  i2cWorker.on('exit', event => console.log('worker exit', event))

  const i2cWSServer = new WebSocket.Server({ noServer: true })
  i2cWSServer.on('connection', handleWSConnectionOverServicePort(i2cWorker, 'i2c'))
  server.on('upgrade', handleWSUpgradeOverWSServer(i2cWSServer))

  const o = new PerformanceObserver((list, _observer) => {
    console.log('⏱ observations: ', list.getEntriesByType('measure').map(ob => ob.name + ' ' + ob.duration))
  })
  o.observe({ buffered: true, entryTypes: [ 'measure' ] })

}
