import { I2CBus } from '@johntalton/and-other-delights'
import { I2CPort } from './port.js'

export class I2CPortService {
  static from(servicePort: MessagePort, bus: I2CBus): void {
    const clients = new Set()

    servicePort.on('message', connectMessage => {
      console.log('service port client connect message')
      const { port } = connectMessage

      clients.add(port)

      port.on('message', async clientMessage => {
        const result = await I2CPort.handleMessage(bus, clientMessage)
        port.postMessage(result, result.buffer !== undefined ? [ result.buffer ] : [])
      })

      port.on('close', () => {
        console.log('client port goodbye')

        if(!clients.has(port)) { console.warn('client port not in clients list') }
        clients.delete(port)
        port.close()
      })

      port.on('messageerror', e => console.warn('client port message error', e))
    })

    servicePort.on('messageerror', error => console.warn('service port message error', error))
    servicePort.on('close', () => { console.log('close service port'); clients.forEach(p => p.close()) })
  }
}
