import { MessageChannel } from 'worker_threads'

import i2c from 'i2c-bus'

import bosch from '@johntalton/boschieu'
import aod from '@johntalton/and-other-delights'

import { I2CPortBus } from '@johntalton/i2c-port'
import { i2cMultiPortService } from './service.js'

const { BoschIEU } = bosch
const { I2CAddressedBus } = aod

async function ieu(port, bus) {
  console.log('IEU Client - single thread port abstraction')

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
