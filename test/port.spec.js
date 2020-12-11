import mochaMod from 'mocha'
import chaiMod from 'chai'

const { describe, it } = mochaMod
const { expect } = chaiMod

import { I2CScriptBus, EOS_SCRIPT } from '@johntalton/and-other-delights'
import { I2CPort } from '@johntalton/i2c-port'

describe('port', () => {
  describe('handleMessage', () => {
    it('should transform readBlock message', async () => {
      const script = [
        { method: 'readI2cBlock', result: { bytesRead: 3, buffer: new Uint8Array(3)} },
        ...EOS_SCRIPT
      ]
      const bus = I2CScriptBus.openPromisified(42, script)
      const result = await I2CPort.handleMessage(bus, { namespace: '', type: 'readBlock', bus: 42, address: 0x00, cmd: 0x00, length: 3 })

      expect(result).is.a.instanceOf(Object)
      expect(result.bytesRead).to.equal(3)
    })
  })
})