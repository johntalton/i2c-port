const { isMainThread, MessageChannel } = require('worker_threads')
const { BoschIEU } = require('@johntalton/boschieu')

const { I2CAddressedBus } = require('@johntalton/and-other-delights')


async function i2cMultiPortService(port) {
  const i2c = require('i2c-bus')
  const { I2CPort } = require('../')

  console.log('I2C Worker')

  port.on('message', async message => {
    console.log('I2CWorker recived client setup message')

    const { bus } = message
    const busX = await i2c.openPromisified(bus)

    const { port } = message
    port.on('message', async clientMessage => {
      const { type, bus, address } = clientMessage
      console.log('I2CWorker recived client action', type)
      const result = await I2CPort.handleMessage(busX, clientMessage)
      port.postMessage(result, result.buffer ? [ result.buffer.buffer ] : [])
      // port.postMessage(result, [ result.buffer?.buffer ])
    })
    port.on('close', () => console.log('I2CWorker sais goodbye to client'))
    port.on('messageerror', e => console.log('I2CWorker client message error', e))
  })
}

async function foo(port, bus) {
  const { I2CPortBus } = require('../')

  console.log('IEU Client Worker')

  const i2cN = await I2CPortBus.openPromisified(port, bus)
  const addressedI2C1 = new I2CAddressedBus(i2cN, 0x77);
  const sensor = await BoschIEU.sensor(addressedI2C1);

  // console.log(sensor)

  await sensor.detectChip()
  console.log('Profile', await sensor.profile())
}

const mc = new MessageChannel()
i2cMultiPortService(mc.port1)
foo(mc.port2, 1)
