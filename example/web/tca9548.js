/* eslint-disable spellcheck/spell-checker */
// eslint-disable-next-line max-classes-per-file
class Converter {
  static channelsToMask(channels) {
    if(channels.length === 0) { return 0 }

    return channels.reduce((acc, item) => {
      if(!Number.isInteger(item) || item < 0 || item >= 8) { throw new Error('invalid channel: ' + item) }
      return acc | (1 << item)
    }, 0)
  }

  static maskToChannels(mask) {
    // console.log('mask to channel', mask);
    // todo range(channelCount)
    return [0, 1, 2, 3, 4, 5, 6, 7].filter(idx => {
      return ((mask >> idx) & 1) === 1
    })
  }
}


class Common {
  static setChannels(bus, channels) {
    // console.log('set channels:', channels);
    const mask = Converter.channelsToMask(channels)
    const u8Mask = new Uint8Array(1)
    u8Mask[0] = mask
    return bus.i2cWrite(u8Mask)
  }

  static getChannels(bus) {
    return bus.i2cRead(1).then(mask => {
      const u8Mask = new Uint8Array(mask)
      return Converter.maskToChannels(u8Mask[0])
    })
  }
}

export const I2C_ADDRESSES = [
  0x70, 0x71, 0x72, 0x73,
  0x74, 0x75, 0x76, 0x77
]
export const [DEFAULT_I2C_ADDRESS] = I2C_ADDRESSES

/**
 * Device instance object API and Factory.
 **/
export class Tca9548a {
  static from(bus, options) { return Promise.resolve(new Tca9548a(bus, options)) }

  constructor(bus, _options) { this._bus = bus }

  // direct access to channels selection
  getChannels() { return Common.getChannels(this._bus); }
  setChannels(channels) { return Common.setChannels(this._bus, channels) }
}
