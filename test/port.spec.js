import mochaMod from 'mocha'
import chaiMod from 'chai'

const { describe, it } = mochaMod
const { expect } = chaiMod

import { I2CScriptBus, EOS_SCRIPT } from '@johntalton/and-other-delights'
import { I2CPort } from '@johntalton/i2c-port'

import { I2CLogBus } from './i2c-logbus.js'

describe('port', () => {
  describe('handleMessage', () => {
    it('should transform readBlock message', async () => {
      const script = [
        { method: 'no-debug' },
        { method: 'readI2cBlock', result: { bytesRead: 3, buffer: Uint8Array.from([ 1, 3, 4 ]) } },
        ...EOS_SCRIPT
      ]
      const bus = await I2CScriptBus.openPromisified(script)
      const result = await I2CPort.handleMessage(bus, { namespace: 'NS', type: 'readI2cBlock', address: 0x00, cmd: 0x00, length: 3 })

      expect(result).is.a.instanceOf(Object)
      expect(result.type).to.not.equal('error', result.why)
      expect(result.type).to.equal('readResult')
      expect(result.namespace).to.equal('NS')
      expect(result.bytesRead).to.equal(3)
      expect(result.buffer).to.not.equal(undefined)
      expect(result.buffer.length).to.equal(3)
    })
  })
})
