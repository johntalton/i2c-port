const WARN_READ_LENGTH = 32
const WARN_WRITE_LENGTH = 32
const BUS_FILE_PREFIX = '/dev/i2c-'
const DEFAULT_FILL = 0

export class I2CAddressedBus {
  constructor(i2cBus, address, sharedReadBuffer) {
    this._address = address
    this._bus = i2cBus
    this._sharedReadBuffer = sharedReadBuffer // shared buffer for reading
  }
  static from(i2cBus, address) {
    return Promise.resolve(Object.freeze(new I2CAddressedBus(i2cBus, address)));
  }
  get name() {
    return 'i2c:' + BUS_FILE_PREFIX + this._bus.busNumber + '/0x' + this._address.toString(16)
  }
  // get bus(): I2CBus { return this._bus; }
  // get address(): I2CAddress { return this._address; }
  _getReadBuffer(length, fill = DEFAULT_FILL) {
    // not using shared buffer, allocate a new instance now
    if(this._sharedReadBuffer === undefined) {
      return new ArrayBuffer(length)
    }
    // return shared buffer if its large enough
    if(length > this._sharedReadBuffer.byteLength) {
      throw new Error('shared buffer to small')
    }
    return this._sharedReadBuffer
  }
  close() { return this._bus.close() }
  read(cmd, length) {
    if(length > WARN_READ_LENGTH) {
      console.log('over max recommended r length', length)
    }
    return this._bus.readI2cBlock(this._address, cmd, length, this._getReadBuffer(length))
      .then(({ bytesRead, buffer }) => { return buffer })// todo bytesRead
  }
  write(cmd, bufferSource) {
    if(bufferSource === undefined) {
      throw new Error('use specific single byte call')
    }

    const isView = ArrayBuffer.isView(bufferSource)
    const isAB = bufferSource instanceof ArrayBuffer

    if(!isView && !isAB) {
      throw new Error('not a bufferSource')
    }
    if(bufferSource.byteLength > WARN_WRITE_LENGTH) {
      console.log('over max recommend w length')
    }
    return this._bus.writeI2cBlock(this._address, cmd, bufferSource.byteLength, isView ? bufferSource.buffer : bufferSource)
        // eslint-disable-next-line no-useless-return
        .then(({ bytesWritten }) => { return }) // todo bytesWritten
  }
  // TODO rename this, as it is non-standard.
  writeSpecial(special) {
    return this._bus.sendByte(this._address, special)
  }
  i2cRead(length) {
    return this._bus.i2cRead(this._address, length, this._getReadBuffer(length))
          .then(({ bytesRead, buffer }) => buffer) // todo byteRead
  }
  i2cWrite(buffer) {
    return this._bus.i2cWrite(this._address, buffer.length, buffer)
      // eslint-disable-next-line no-useless-return
      .then(({ bytesWritten }) => { return }) // todo bytesWritten
  }
}
