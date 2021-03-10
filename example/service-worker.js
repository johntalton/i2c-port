import { isMainThread, parentPort } from 'worker_threads'
import { FivdiBusProvider} from './fivdi-bus.js'

import { i2cMultiPortService } from './service.js'

i2cMultiPortService(parentPort, await FivdiBusProvider.openPromisified(1))
