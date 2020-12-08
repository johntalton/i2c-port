export class I2CWebBus /*implements I2CBus*/ {
  static openPromisified(busNumber) {
    return Promise.resolve(new I2CWebBus(busNumber))
  }
  constructor(port, busNumber) {
    this.busNumber = busNumber
  }
  readI2cBlock(address, cmd, length, buffer) {
    throw new Error('readI2cBlock')
  }
}
