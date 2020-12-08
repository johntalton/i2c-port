const { isMainThread, parentPort } = require('worker_threads')
const { I2CPort } = require('../')

function i2cMultiPortService(servicePort, i2cFactory) {

  let clients = []

  servicePort.on('message', async connectMessage => {
    console.log('i2c client connect message')
    const { port } = connectMessage

    let busX = undefined;
    //    busX = await i2cFactory.openPromisified(1)


    clients = [...clients, port]

    port.on('message', async clientMessage => {
      //console.log('i2c recv client message', clientMessage)
      const { bus } = clientMessage

      if(busX === undefined) {
        console.log('i2c alloc bus from factory', bus)
        if(bus !== 1) {
          console.log('i2c invalid bus number', bus)
          port.postMessage({ opaque: clientMessage.opaque, type: 'error', why: 'invalid bus number' })
          return
        }

        //
        busX = await i2cFactory.openPromisified(bus)
      }

      if(clientMessage.buffer !== undefined) {
        clientMessage.buffer = Buffer.from(clientMessage.buffer)
      }

      //console.log('feeding i2cport handlemessage', busX, clientMessage)
      const result = await I2CPort.handleMessage(busX, clientMessage)

      // console.log('raw result', result)
      port.postMessage(result, result.buffer ? [ result.buffer.buffer ] : [])
    })

    port.on('close', () => {
      console.log('I2CWorker Client sais goodbye to client')

      if(!clients.includes(port)) { console.log('client port not in clients list') }
      clients = clients.filter(p => p !== port)

      port.close()

      if(busX !== undefined) { busX.close() }
    })

    port.on('messageerror', e => console.log('I2CWorker Client message error', e))
  })

  servicePort.on('messageerror', error => console.log('message error', error))
  servicePort.on('close', () => { console.log('close service port'); clients.forEach(p => p.close()) })
}

// null false - worker
// <obj> true - port / include
if(module.parent === null && !isMainThread) {
  const i2c = require('i2c-bus')

  i2cMultiPortService(parentPort, i2c)
}

module.exports = { i2cMultiPortService }
