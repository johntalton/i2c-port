const { isMainThread, MessageChannel } = require('worker_threads')
const { BoschIEU } = require('@johntalton/boschieu')

const { I2CAddressedBus } = require('@johntalton/and-other-delights')


async function i2cMultiPortService(servicePort) {
  const i2c = require('i2c-bus')
  const { I2CPort } = require('../')

  const clients = []

  servicePort.on('message', async message => {
    const { port, bus } = message

    const busX = await i2c.openPromisified(bus)

    // we never remove from list, but we do close
    clients.push(port)

    port.on('message', async clientMessage => {
      const { type, bus, address } = clientMessage
      const result = await I2CPort.handleMessage(busX, clientMessage)
      port.postMessage(result, result.buffer ? [ result.buffer.buffer ] : [])
    })
    port.on('close', () => { console.log('I2CWorker Client sais goodbye to client'); })
    port.on('messageerror', e => console.log('I2CWorker Client message error', e))
  })

  servicePort.on('close', () => { clients.forEach(p => p.close()) })
}

async function foo(port, bus) {
  const { I2CPortBus } = require('../')

  console.log('IEU Client Worker')
  try {

    const i2cN = await I2CPortBus.openPromisified(port, bus)
    const addressedI2C1 = new I2CAddressedBus(i2cN, 0x77);
    const sensor = await BoschIEU.sensor(addressedI2C1);

    // console.log(sensor)

    await sensor.detectChip()
    await sensor.calibration()
    await sensor.setProfile({ mode: 'NORMAL' })
    console.log('Profile', await sensor.profile())

    console.log('Goodbye')
  }
  finally {
    port.close()
  }
}

const mc = new MessageChannel()
i2cMultiPortService(mc.port1)
foo(mc.port2, 1)
