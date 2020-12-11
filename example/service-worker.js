import { isMainThread, parentPort } from 'worker_threads'
import i2c from 'i2c-bus'

import { i2cMultiPortService } from './service.js'

i2cMultiPortService(parentPort, i2c)
