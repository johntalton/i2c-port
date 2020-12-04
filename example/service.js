const { isMainThread, parentPort } = require('worker_threads')

function i2cMultiPortService(servicePort) {
  const i2c = require('i2c-bus')
  const { I2CPort } = require('../')

  const clients = []

  servicePort.on('message', async message => {
    console.log('client connect message', message)
    const { port, bus } = message

    const busX = await i2c.openPromisified(bus)

    // we never remove from list, but we do close
    clients.push(port)

    port.on('message', async clientMessage => {
      console.log('client message', clientMessage)
      const { type, bus, address } = clientMessage
      const result = await I2CPort.handleMessage(busX, clientMessage)
      console.log('raw result', result)
      port.postMessage(result, result.buffer ? [ result.buffer.buffer ] : [])
    })
    port.on('close', () => { console.log('I2CWorker Client sais goodbye to client'); })
    port.on('messageerror', e => console.log('I2CWorker Client message error', e))
  })

  servicePort.on('close', () => { clients.forEach(p => p.close()) })
}

// null false - worker
// <obj> true - port / include
if(module.parent === null && !isMainThread) { i2cMultiPortService(parentPort) }

module.exports = { i2cMultiPortService }
