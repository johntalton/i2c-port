/* eslint-disable max-classes-per-file */
//import { I2CBus } from './aod.min.js'
import { MessageTransform } from './message-transform.js'

export class I2CWebBus /* extends I2CBus */ {
  static openPromisified(ws) {
    return Promise.resolve(new I2CWebBus(ws))
  }

  static onMessage(self, message) {
    const { opaque: id, type, buffer } = message

    const transaction = self.pendingTransactions.get(id)
    if(transaction === undefined) {
      console.warn('unknown transaction message', message)
    }

    console.debug(message)

    if(type === 'error') {
      clearTimeout(transaction.timer)
      self.pendingTransactions.delete(id)
      transaction.reject(new Error(message.why))
      return
    }

    console.log('resolving transaction', id)
    clearTimeout(transaction.timer)
    self.pendingTransactions.delete(id)
    transaction.resolve({ buffer })

  }

  async transact(type, message) {
    const id = this.nextId
    this.nextId++

    const transactionTimeoutMS = 1000

    let capturedResolve
    let capturedReject
    const p = new Promise((resolve, reject) => {
      capturedResolve = resolve
      capturedReject = reject
    })

    this.pendingTransactions.set(id, {
      opaque: id,

      ...message,

      futureResult: p,
      resolve: capturedResolve,
      reject: capturedReject,
      timer: setTimeout(() => { this.pendingTransactions.delete(id); capturedReject(new Error('Timed Out')) }, transactionTimeoutMS)
    })

    console.debug({ type, message })
    this.ws.send(MessageTransform.messageToStringMessage({
      opaque: id,
      type,
      bus: this.busNumber,

      ...message
    }))


    return p
  }


  constructor(ws) {
    this.ws = ws
    this.nextId = 0
    this.pendingTransactions = new Map()
  }

  sendByte(address, byte) {

  }

  readI2cBlock(address, cmd, length, buffer) {

  }

  writeI2cBlock(address, cmd, length, buffer) {

  }

  i2cRead(address, length, buffer) {
    return this.transact('read', { address, length, buffer })
  }

  i2cWrite(address, length, buffer) {
    return this.transact('write', { address, length, buffer })
  }
}
