/* eslint-disable no-undefined */
import { I2CBus } from '@johntalton/and-other-delights'
import { I2CPort } from './port.js'

export class I2CPortService {
  static from(servicePort: MessagePort, bus: I2CBus): void {
    const clients = new Set<MessagePort>()

    servicePort.addEventListener('message', event => {
      const { data: connectMessage } = event
    // servicePort.on('message', connectMessage => {
    // console.log(connectMessage)
      const { port } = connectMessage

      clients.add(port)

      port.addEventListener('message', (event: MessageEvent) => {
        const { data: clientMessage } = event

      // port.on('message', async clientMessage => {
        I2CPort.handleMessage(bus, clientMessage)
          .then(result => {
            // console.log('result', result)
            if('buffer' in result) {
              port.postMessage(result, [ ArrayBuffer.isView(result.buffer) ? result.buffer.buffer : result.buffer ])
            }
            else {
              port.postMessage(result)
            }

          })
          .catch(e => console.warn(e))
      })

      port.addEventListener('close', () => {
      // port.on('close', () => {
        if(!clients.has(port)) { return }

        clients.delete(port)
        port.close()
      })
    })

    servicePort.addEventListener('close', () => clients.forEach(p => p.close()))
    // servicePort.on('close', () => clients.forEach(p => p.close()))
  }
}
