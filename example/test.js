import { isMainThread, Worker, MessageChannel, workerData, parentPort } from 'worker_threads'

import { i2cMultiPortService } from './service'

async function basicClientService(port, bus, address) {
  console.log('Client Worker')

  let state = 0

  port.on('message', message => {
    console.log('Client Worker received message', message)

    if(message.type === 'error') { return }

    if(state === 1) {
      console.log('normal mode enabled')
      return
    }

    if(state !== 0) { return }
    state = 1

    const array = message.buffer
    const id = Buffer.from(array).readUInt8(0)
    console.log('ID', id)
    if(id !== 0x60) { return }

    console.log('Enable Normal Mode')
    const buffer = Buffer.from([ 0x33 ])
    port.postMessage({ type: 'writeBlock', bus, address, cmd: 0x1B, buffer }, [ buffer.buffer ])
  })

  // script
  const cmd = 0x00
  port.postMessage({ type: 'readBlock', bus, address, cmd, length: 1 })
}

if (isMainThread) {
  const workerData = { i2c: true }
  const i2cWorker = new Worker(__filename, { workerData })

  const clients = [{ bus: 1, address: 0x76 }, { bus: 1, address: 0x77 }]
    .map((client, index) => {
      const { bus, address } = client
      const mc = new MessageChannel()

      i2cWorker.postMessage({ bus, port: mc.port2 }, [ mc.port2 ])

      const worker = new Worker(__filename, { workerData: { bus, address } })

      // proxy message
      worker.on('message', message => mc.port1.postMessage(message))
      mc.port1.on('message', message => worker.postMessage(message))

      return { worker }
    })

  setTimeout(() => { clients.forEach(client => client.worker.terminate()); i2cWorker.terminate() }, 1000)
} else {
  const { i2c, bus, address } = workerData
  if(i2c === true) {
    import i2c from 'i2c-bus'
    i2cMultiPortService(parentPort, i2c)
  } else {
    basicClientService(parentPort, bus, address)
  }
}
