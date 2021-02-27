import { parentPort } from 'worker_threads'

import { i2cMultiPortService } from './service.js'

import { I2CScriptBus, EOS_SCRIPT} from '@johntalton/and-other-delights'

const script = [
  { method: 'no-debug' },
  { method: 'i2cRead', result: { bytesRead: 1, buffer: Uint8Array.from([ 0b00000111 ]).buffer } },
  { method: 'i2cWrite', result: { bytesWritten: 1 } },
  { method: 'i2cRead', result: { bytesRead: 1, buffer: Uint8Array.from([ 0b00101000 ]).buffer } },
  ...EOS_SCRIPT
]

const bus = await I2CScriptBus.openPromisified(script)

i2cMultiPortService(parentPort, bus)
