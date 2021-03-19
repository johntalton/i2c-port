/* eslint-disable no-undefined */
import { I2CBus } from '@johntalton/and-other-delights'
import { I2CPort } from './port.js'

export class I2CPortService {
  static from(servicePort: MessagePort, bus: I2CBus): void {
    const clients = new Set()

    servicePort.on('message', connectMessage => {
      const { port } = connectMessage

      clients.add(port)

      port.on('message', async clientMessage => {
        const result = await I2CPort.handleMessage(bus, clientMessage)
        port.postMessage(result, result.buffer !== undefined ? [ result.buffer ] : [])
      })

      port.on('close', () => {
        if(!clients.has(port)) { return }

        clients.delete(port)
        port.close()
      })
    })

    servicePort.on('close', () => clients.forEach(p => p.close()))
  }
}
