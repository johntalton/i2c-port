//import { I2CBus } from '@johntalton/and-other-delights'

export class I2CLogBus /*extends I2CBus*/ {
  static from(bus) { return new I2CLogBus(bus) }

  constructor(bus) {
    this.bus = bus
  }

  async readI2cBlock(...p) {
    console.log('LogBus::readI2cBlock', { p })
    const result = await this.bus.readI2cBlock(...p)
    console.log('LogBus::readI2cBlock', { result })
    return result
  }
}
