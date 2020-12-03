import { MessageChannel, MessagePort } from 'worker_threads'

import * as b from '@johntalton/and-other-delights'

export class I2CPortBus implements b.I2CBus {
  readonly port: MessagePort
  readonly busNumber: b.I2CBusNumber

  static openPromisified(providerPort: MessagePort, busNumber: b.I2CBusNumber): Promise<I2CPortBus> {
    return Promise.resolve(new I2CPortBus(providerPort, busNumber))
  }

  private constructor(port: MessagePort, busNumber: b.I2CBusNumber) {
    this.port = port;
    this.busNumber = busNumber
  }

  close(): void {}

  sendByte(address: b.I2CAddress, byte: number): Promise<void> {
    throw new Error('impl')
  }

  readI2cBlock(address: b.I2CAddress, cmd: number, length: number, buffer: Buffer): Promise<b.I2CReadResult> {
    console.log('call readI2cBlock on remote')
    const mc = new MessageChannel()
    this.port.postMessage({ bus: this.busNumber, port: mc.port2 }, [ mc.port2 ])
    return new Promise((resolve, reject) => {
      mc.port1.on('message', message => {
        console.log('readI2cBlock message', message)
        if(message.type === 'error') { return reject(new Error(message.why)) }
        resolve(message)
      })
      mc.port1.on('close', () => {
        reject(new Error(''))
      })
      mc.port1.postMessage({ type: 'readBlock', bus: this.busNumber, address, cmd, length })
    })
  }

  writeI2cBlock(address: b.I2CAddress, cmd: number, length: number, buffer: Buffer): Promise<b.I2CWriteResult> {
    throw new Error('impl')
  }

  i2cRead(address: b.I2CAddress, length: number, buffer: Buffer): Promise<b.I2CReadResult> {
    throw new Error('impl')
  }

  i2cWrite(address: b.I2CAddress, length: number, buffer: Buffer): Promise<b.I2CWriteResult> {
    throw new Error('impl')
  }
}
