/* eslint-disable immutable/no-this */
/* eslint-disable fp/no-this */
import {
  I2CAddress, I2CBufferSource,
  I2CBus,
  I2CReadResult, I2CWriteResult
} from '@johntalton/and-other-delights'

import { ReadWrite } from './messages'

export class I2CPortBus implements I2CBus {
  readonly port: MessagePort
  readonly namespace: string
  readonly name: string

  static openPromisified(providerPort: MessagePort): Promise<I2CPortBus> {
    return Promise.resolve(new I2CPortBus(providerPort))
  }

  private constructor(port: MessagePort) {
    this.name = ''
    this.port = port
    this.namespace = ''
  }

  close(): void { this.port.close() }

  private static fire<R>(port: MessagePort, call: ReadWrite): Promise<R> {
    return new Promise((resolve, reject) => {
      const timeoutMS = 1000 * 2
      const timer = setTimeout(() => {
        port.close()
        reject(new Error('timeout'))
      }, timeoutMS)

      port.addEventListener('message', event => {
        const { data: message } = event
      //port.on('message', message => {
        if(message.type === 'error') { reject(new Error(message.why)); return }
        // console.log('resolving with', message)
        resolve(message)
        clearTimeout(timer)
        port.close()
      })

      port.addEventListener('close', () => {
      // port.on('close', () => {
        clearTimeout(timer)
        reject(new Error('closed'))
      })

      if('buffer' in call && call.buffer) {
        // console.log('return with buffer', call)
        const transferBuffer = ArrayBuffer.isView(call.buffer) ? call.buffer.buffer : call.buffer
        port.postMessage(call, [ transferBuffer ])
      } else {
        // console.log('return')
        port.postMessage(call)
      }
    })
  }

  private static async sideChannelFire<R>(port: MessagePort, call: ReadWrite): Promise<R> {
    const mc = new MessageChannel()
    // console.log('sideChannelFire')
    port.postMessage({ port: mc.port2 }, [ mc.port2 ])
    return I2CPortBus.fire(mc.port1, call)
  }

  sendByte(address: I2CAddress, byteValue: number): Promise<void> {
    return I2CPortBus.sideChannelFire(this.port, {
      namespace: this.namespace,
      type: 'sendByte',
      address,
      byteValue
    })
  }

  readI2cBlock(address: I2CAddress, cmd: number, length: number, _bufferSource: never): Promise<I2CReadResult> {
    return I2CPortBus.sideChannelFire(this.port, {
      namespace: this.namespace,
      type: 'readI2cBlock',
      address,
      cmd,
      length
    })
  }

  writeI2cBlock(address: I2CAddress, cmd: number, length: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
    return I2CPortBus.sideChannelFire(this.port, {
      namespace: this.namespace,
      type: 'writeI2cBlock',
      address,
      cmd,
      buffer: bufferSource
    })
  }

  i2cRead(address: I2CAddress, length: number, _bufferSource: never): Promise<I2CReadResult> {
    return I2CPortBus.sideChannelFire(this.port, {
      namespace: this.namespace,
      type: 'i2cRead',
      address,
      length
    })
  }

  i2cWrite(address: I2CAddress, length: number, bufferSource: I2CBufferSource): Promise<I2CWriteResult> {
    return I2CPortBus.sideChannelFire(this.port, {
      namespace: this.namespace,
      type: 'i2cWrite',
      address,
      buffer: bufferSource
    })
  }
}
