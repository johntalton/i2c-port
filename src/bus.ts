/* eslint-disable immutable/no-this */
/* eslint-disable fp/no-this */
import { MessageChannel, MessagePort } from 'worker_threads'

import {
  I2CAddress, I2CBus,
  I2CBufferSource,
  I2CReadResult, I2CWriteResult
} from '@johntalton/and-other-delights'

import { ReadWrite } from './messages'

export class I2CPortBus implements I2CBus {
  readonly port: MessagePort
  readonly busNumber: number
  readonly namespace: string
  readonly name: string

  static openPromisified(providerPort: MessagePort, busNumber: number): Promise<I2CPortBus> {
    return Promise.resolve(new I2CPortBus(providerPort, busNumber))
  }

  private constructor(port: MessagePort, busNumber: number) {
    this.name = ''
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
        port.postMessage(call, [ call.buffer ])
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

  sendByte(address: I2CAddress, byteValue: number): Promise<void> {
    return I2CPortBus.sideChannelFire(this.port, {
      namespace: this.namespace,
      type: 'sendByte',
      bus: this.busNumber,
      address,
      byteValue
    })
  }

  readI2cBlock(address: I2CAddress, cmd: number, length: number, _bufferSource: never): Promise<I2CReadResult> {
    return I2CPortBus.sideChannelFire(this.port, {
      namespace: this.namespace,
      type: 'readI2cBlock',
      bus: this.busNumber,
      address,
      cmd,
      length
    })
  }

  writeI2cBlock(address: I2CAddress, cmd: number, length: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
    return I2CPortBus.sideChannelFire(this.port, {
      namespace: this.namespace,
      type: 'writeI2cBlock',
      bus: this.busNumber,
      address,
      cmd,
      buffer: bufferSource
    })
  }

  i2cRead(address: I2CAddress, length: number, _bufferSource: never): Promise<I2CReadResult> {
    return I2CPortBus.sideChannelFire(this.port, {
      namespace: this.namespace,
      type: 'i2cRead',
      bus: this.busNumber,
      address,
      length
    })
  }

  i2cWrite(address: I2CAddress, length: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
    return I2CPortBus.sideChannelFire(this.port, {
      namespace: this.namespace,
      type: 'i2cWrite',
      bus: this.busNumber,
      address,
      buffer: bufferSource
    })
  }
}
