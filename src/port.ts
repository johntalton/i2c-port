import { I2CBus } from '@johntalton/and-other-delights'

import * as m from  './messages'

export class I2CPort {
  static async handleMessage(bus: I2CBus, message: m.ReadWrite): Promise<m.Result> {
    const { type } = message
    switch(type) {
    case 'sendByte': return I2CPort.sendByte(bus, message as m.SendByte)
    case 'read': return I2CPort.read(bus, message as m.Read)
    case 'write': return I2CPort.write(bus, message as m.Write)

    case 'readBlock': return I2CPort.readBlock(bus, message as m.ReadBlock)
    case 'writeBlock': return I2CPort.writeBlock(bus, message as m.WriteBlock)
    default:
      return { type: 'error', why: `unknown type: ${type}` }
    }
  }

  private static async sendByte(bus: I2CBus, message: m.SendByte): Promise<m.WriteResult> {
    throw new Error('unimpl')
  }

  private static async read(bus: I2CBus, message: m.Read): Promise<m.ReadResult> {
    throw new Error('unimpl')
  }

  private static async write(bus: I2CBus, message: m.Write): Promise<m.WriteResult> {
    throw new Error('unimpl')
  }

  private static async readBlock(bus: I2CBus, message: m.ReadBlock): Promise<m.ReadResult> {
    try {
      const { address, cmd, length } = message
      const buffer = Buffer.alloc(length)
      const { bytesRead } = await bus.readI2cBlock(address, cmd, buffer.length, buffer)
      return { type: 'readResult', bytesRead, buffer: buffer.slice(0, bytesRead) }
    } catch(e) {
      return { type: 'error', why: 'readBlock: ' + e.message }
    }
  }

  private static async writeBlock(bus: I2CBus, message: m.WriteBlock): Promise<m.WriteResult> {
    try {
      const { address, cmd, buffer } = message
      const { bytesWritten } = await bus.writeI2cBlock(address, cmd, buffer.length, Buffer.from(buffer))
      return { type: 'writeResult', bytesWritten }
    }
    catch(e) {
      return { type: 'error', why: 'writeBlock: ' + e.message }
    }
  }
}
