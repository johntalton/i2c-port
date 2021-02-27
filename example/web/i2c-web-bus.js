/* eslint-disable max-classes-per-file */
//import { I2CBus } from './node_modules/@johntalton/and-other-delights/lib/aod.js'

import { MessageTransform } from './message-transform.js'

export class I2CWebBus /* extends I2CBus */ {
  static openPromisified(ws) {
    return Promise.resolve(new I2CWebBus(ws))
  }

  /**
   * @param self {I2CWebBus} bus on which to apply message
   * @param encodedMessage {string}
   * @return {void}
   */
  static onMessage(self, encodedMessage) {
    const message = MessageTransform.decodeMessage(encodedMessage)
    const { opaque: id, type } = message

    const transaction = self.pendingTransactions.get(id)
    if(transaction === undefined) {
      console.warn('unknown transaction message', message)
    }

    if(type === 'error') {
      //console.log('rejecting transaction', id)
      clearTimeout(transaction.timer)
      self.pendingTransactions.delete(id)
      transaction.reject(new Error(message.why))
      return
    }

    //console.log('resolving transaction', id)
    clearTimeout(transaction.timer)
    self.pendingTransactions.delete(id)
    transaction.resolve(message)

  }

  /**
   * @param type {string}
   * @param message {Transaction}
   * @return {Promise<void>} async result of transaction
   */
  transact(type, message) {
    const id = this.nextId
    this.nextId++

    const transactionTimeoutMS = 1000

    let capturedResolve
    let capturedReject
    const futureResult = new Promise((resolve, reject) => {
      capturedResolve = resolve
      capturedReject = reject
    })

    this.pendingTransactions.set(id, {
      opaque: id,

      ...message,

      futureResult,
      resolve: capturedResolve,
      reject: capturedReject,
      timer: setTimeout(() => { this.pendingTransactions.delete(id); capturedReject(new Error('Timed Out')) }, transactionTimeoutMS)
    })

    this.ws.send(MessageTransform.encodeMessage({
      opaque: id,
      type,

      ...message
    }))


    return futureResult
  }


  constructor(ws) {
    this.ws = ws
    this.nextId = 0
    this.pendingTransactions = new Map()
  }

  sendByte(address, byteValue) {
    return this.transact('sendByte', { address, byteValue })
  }

  readI2cBlock(address, cmd, length, readBuffer) {
    return this.transact('readI2cBlock', { address, cmd, length })
  }

  writeI2cBlock(address, cmd, length, buffer) {
    return this.transact('writeI2cBlock', { address, cmd, length, buffer })
  }

  i2cRead(address, length, readBuffer) {
    return this.transact('i2cRead', { address, length })
  }

  i2cWrite(address, length, buffer) {
    return this.transact('i2cWrite', { address, length, buffer })
  }
}
