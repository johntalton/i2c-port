import { MessageChannel, MessagePort } from 'worker_threads'

import {
  I2CBus, I2CBusNumber, I2CAddress,
  I2CReadResult, I2CWriteResult
} from '@johntalton/and-other-delights'

import { ReadWrite  } from './messages' 

export class I2CPortBus implements I2CBus {
  readonly port: MessagePort
  readonly busNumber: I2CBusNumber

  static openPromisified(providerPort: MessagePort, busNumber: I2CBusNumber): Promise<I2CPortBus> {
    return Promise.resolve(new I2CPortBus(providerPort, busNumber))
  }

  private constructor(port: MessagePort, busNumber: I2CBusNumber) {
    this.port = port;
    this.busNumber = busNumber
  }

  close(): void {}

  private static fire<R>(port: MessagePort, call: ReadWrite): Promise<R> {
    return new Promise((resolve, reject) => {
      const timeoutMS = 1000 * 2
      const timer = setTimeout(() => reject(new Error('timeout')), timeoutMS)

      port.on('message', message => {
        if(message.type === 'error') { return reject(new Error(message.why)) }
        resolve(message)
        clearTimeout(timer)
        port.close()
      })
      port.on('close', () => {
        clearTimeout(timer)
        reject(new Error('closed'))
      })

      if('buffer' in call) {
        port.postMessage(call, [ call.buffer.buffer ])
      }
      else {
        port.postMessage(call)
      }
    })
  }

  private static async sideChannelFire<R>(port: MessagePort, bus: I2CBusNumber, call: ReadWrite): Promise<R> {
    const mc = new MessageChannel()
    port.postMessage({ bus, port: mc.port2 }, [ mc.port2 ])
    return I2CPortBus.fire(mc.port1, call)
  }


  sendByte(address: I2CAddress, byte: number): Promise<void> {
    return I2CPortBus.sideChannelFire(this.port, this.busNumber, { type: 'sendByte', address, byte})
  }

  readI2cBlock(address: I2CAddress, cmd: number, length: number, buffer: Buffer): Promise<I2CReadResult> {
    return I2CPortBus.sideChannelFire(this.port, this.busNumber, { type: 'readBlock', address, cmd, length })
  }

  writeI2cBlock(address: I2CAddress, cmd: number, length: number, buffer: Buffer): Promise<I2CWriteResult> {
    return I2CPortBus.sideChannelFire(this.port, this.busNumber, { type: 'writeBlock', address, cmd, buffer })
  }

  i2cRead(address: I2CAddress, length: number, buffer: Buffer): Promise<I2CReadResult> {
    return I2CPortBus.sideChannelFire(this.port, this.busNumber, { type: 'read', address, length })
  }

  i2cWrite(address: I2CAddress, length: number, buffer: Buffer): Promise<I2CWriteResult> {
    return I2CPortBus.sideChannelFire(this.port, this.busNumber, { type: 'write', address, buffer })
  }
}
