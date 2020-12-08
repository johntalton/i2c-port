const { MessageChannel } = require('worker_threads')

const i2c = require('i2c-bus')

const { BoschIEU } = require('@johntalton/boschieu')
const { I2CAddressedBus } = require('@johntalton/and-other-delights')

const { i2cMultiPortService } = require('./service')
const { I2CPortBus } = require('../')

async function ieu(port, bus) {
  console.log('IEU Client')

  try {
    const i2cN = await I2CPortBus.openPromisified(port, bus)
    const addressedI2C1 = new I2CAddressedBus(i2cN, 0x77);
    const sensor = await BoschIEU.sensor(addressedI2C1);

    //
    await sensor.detectChip()
    await sensor.calibration()
    await sensor.setProfile({ mode: 'NORMAL', fifo: { active: true } })
    console.log('Profile', sensor.chip, await sensor.profile())

    const measurement = await sensor.measurement()
    console.log('Measurement', measurement)

    console.log('Goodbye')
  }
  finally {
    port.close()
  }
}

console.log('Running in single-thread abstracted over MessageChannel')
const mc = new MessageChannel()
i2cMultiPortService(mc.port1, i2c)
ieu(mc.port2, 1)
