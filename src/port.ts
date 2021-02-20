import { I2CBus } from '@johntalton/and-other-delights'

import * as m from './messages'

export class I2CPort {
  static async handleMessage(bus: I2CBus, message: m.ReadWrite): Promise<m.Result> {
    const { type } = message

    switch(type) {
    case 'sendByte': return I2CPort.sendByte(bus, message as m.SendByte)
    case 'i2cRead': return I2CPort.read(bus, message as m.Read)
    case 'i2cWrite': return I2CPort.write(bus, message as m.Write)

    case 'readI2cBlock': return I2CPort.readBlock(bus, message as m.ReadBlock)
    case 'writeI2cBlock': return I2CPort.writeBlock(bus, message as m.WriteBlock)
    default: {
      const echo = I2CPort.echoMessage(message)
      return { ...echo, type: 'error', why: `unknown type: ${type}` } as m.Error
    }
    }
  }

  private static echoMessage(message: m.Message): m.WithNamespace & m.WithOpaque & m.WithAddress {
    const { namespace, opaque, bus, address } = message
    return { namespace, opaque, bus, address }
  }

  private static readBufferFromMessageOrAlloc(message: m.Message & m.WithLength): ArrayBuffer {
    const { length } = message
    return new ArrayBuffer(length)
  }


  private static async sendByte(bus: I2CBus, message: m.SendByte): Promise<m.WriteResult> {
    const { address, byteValue } = message
    const echo = I2CPort.echoMessage(message)
    try {
      await bus.sendByte(address, byteValue)
      return { ...echo, type: 'writeResult', bytesWritten: 1 }
    } catch (e) {
      return { ...echo, type: 'error', why: 'sendByte: ' + e.errno + e.message }
    }
  }

  private static async read(bus: I2CBus, message: m.Read): Promise<m.ReadResult> {
    const { address, length } = message
    const echo = I2CPort.echoMessage(message)
    try {
      const in_buffer = I2CPort.readBufferFromMessageOrAlloc(message)
      const { bytesRead, buffer } = await bus.i2cRead(address, length, in_buffer)
      return { ...echo, type: 'readResult', bytesRead, buffer: buffer.slice(0, bytesRead) }
    } catch (e) {
      return { ...echo, type: 'error', why: 'read: ' + e.errno + e.message }
    }
  }

  private static async write(bus: I2CBus, message: m.Write): Promise<m.WriteResult> {
    const { address, buffer } = message
    const echo = I2CPort.echoMessage(message)
    try {
      const { bytesWritten } = await bus.i2cWrite(address, buffer.byteLength, buffer)
      return { ...echo, type: 'writeResult', bytesWritten }
    } catch (e) {
      return { ...echo, type: 'error', why: 'writeBlock: ' + e.message }
    }
  }

  private static async readBlock(bus: I2CBus, message: m.ReadBlock): Promise<m.ReadResult> {
    const { address, cmd, length } = message
    const echo = I2CPort.echoMessage(message)
    try {
      const in_buffer = I2CPort.readBufferFromMessageOrAlloc(message)
      const { bytesRead, buffer } = await bus.readI2cBlock(address, cmd, length, in_buffer)
      return { ...echo, type: 'readResult', bytesRead, buffer: buffer.slice(0, bytesRead) }
    } catch (e) {
      return { ...echo, type: 'error', why: 'readBlock: ' + e.errno + ' ' + e.message }
    }
  }

  private static async writeBlock(bus: I2CBus, message: m.WriteBlock): Promise<m.WriteResult> {
    const { address, cmd, buffer } = message
    const echo = I2CPort.echoMessage(message)
    try {
      const { bytesWritten } = await bus.writeI2cBlock(address, cmd, buffer.byteLength, buffer)
      return { ...echo, type: 'writeResult', bytesWritten }
    } catch (e) {
      return { ...echo, type: 'error', why: 'writeBlock: ' + e.message }
    }
  }
}
