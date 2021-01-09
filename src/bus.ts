import { MessageChannel, MessagePort } from 'worker_threads'
import { setTimeout, clearTimeout } from 'timers'

import {
  I2CBus, I2CBusNumber, I2CAddress,
  I2CReadResult, I2CWriteResult
} from '@johntalton/and-other-delights'

import { ReadWrite } from './messages'

export class I2CPortBus implements I2CBus {
  readonly port: MessagePort
  readonly busNumber: I2CBusNumber
  readonly namespace: string

  static openPromisified(providerPort: MessagePort, busNumber: I2CBusNumber): Promise<I2CPortBus> {
    return Promise.resolve(new I2CPortBus(providerPort, busNumber))
  }

  private constructor(port: MessagePort, busNumber: I2CBusNumber) {
    this.port = port
    this.busNumber = busNumber
    this.namespace = ''
  }

  close(): void { this.port.close() }

  private static fire<R>(port: MessagePort, call: ReadWrite): Promise<R> {
    return new Promise((resolve, reject) => {
      const timeoutMS = 1000 * 2
      const timer = setTimeout(() => reject(new Error('timeout')), timeoutMS)

      port.on('message', message => {
        if(message.type === 'error') { reject(new Error(message.why)); return }
        resolve(message)
        clearTimeout(timer)
        port.close()
      })
      port.on('close', () => {
        clearTimeout(timer)
        reject(new Error('closed'))
      })

      if('buffer' in call && call.buffer) {
        port.postMessage(call, [ call.buffer.buffer ])
      } else {
        port.postMessage(call)
      }
    })
  }

  private static async sideChannelFire<R>(port: MessagePort, call: ReadWrite): Promise<R> {
    const mc = new MessageChannel()
    port.postMessage({ port: mc.port2 }, [ mc.port2 ])
    return I2CPortBus.fire(mc.port1, call)
  }


  sendByte(address: I2CAddress, byte: number): Promise<void> {
    return I2CPortBus.sideChannelFire(this.port, {
      namespace: this.namespace,
      type: 'sendByte',
      bus: this.busNumber,
      address,
      byte
    })
  }

  readI2cBlock(address: I2CAddress, cmd: number, length: number, _buffer: Buffer): Promise<I2CReadResult> {
    return I2CPortBus.sideChannelFire(this.port, {
      namespace: this.namespace,
      type: 'readBlock',
      bus: this.busNumber,
      address,
      cmd,
      length
    })
  }

  writeI2cBlock(address: I2CAddress, cmd: number, length: number, buffer: Buffer): Promise<I2CWriteResult> {
    return I2CPortBus.sideChannelFire(this.port, {
      namespace: this.namespace,
      type: 'writeBlock',
      bus: this.busNumber,
      address,
      cmd,
      buffer: buffer.slice(0, length)
    })
  }

  i2cRead(address: I2CAddress, length: number, _buffer: Buffer): Promise<I2CReadResult> {
    return I2CPortBus.sideChannelFire(this.port, {
      namespace: this.namespace,
      type: 'read',
      bus: this.busNumber,
      address,
      length
    })
  }

  i2cWrite(address: I2CAddress, length: number, buffer: Buffer): Promise<I2CWriteResult> {
    return I2CPortBus.sideChannelFire(this.port, {
      namespace: this.namespace,
      type: 'write',
      bus: this.busNumber,
      address,
      buffer: buffer.slice(0, length)
    })
  }
}
