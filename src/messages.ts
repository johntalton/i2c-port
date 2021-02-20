export type NodeLikeBuffer = Uint8Array | Uint8ClampedArray | Buffer
export type WebLikeBuffer = ArrayBuffer | ArrayBufferView | SharedArrayBuffer
export type PortBuffer = WebLikeBuffer

export type WithNamespace = { namespace: string | '' }
export type WithType = { type: string }
export type WithOpaque = { opaque?: string }
export type WithAddress = { bus: number, address: number }
export type WithCommand = { cmd: number } & WithAddress
export type WithBuffer = { buffer: PortBuffer }
export type WithInBuffer = { buffer?: PortBuffer }
export type WithResultBuffer = { buffer: PortBuffer }
export type WithLength = { length: number }
export type WithOutLength = { length?: number }

export type Message = WithNamespace & WithOpaque & WithType & WithAddress

// misc
export type Error = { type: 'error', why: string } & Message
export type Success = { type: 'success' } & Message

// core request message
export type SendByte = { type: 'sendByte', byteValue: number } & Message
export type Read = { type: 'i2cRead' } & WithInBuffer & WithLength & Message
export type Write = { type: 'i2cWrite' } & WithBuffer & WithOutLength & Message
export type ReadBlock = { type: 'readI2cBlock' } & WithInBuffer & WithLength & WithCommand & Message
export type WriteBlock = { type: 'writeI2cBlock' } & WithBuffer & WithOutLength & WithCommand & Message

// core results
export type ReadResult = { type: 'readResult', bytesRead: number } & WithResultBuffer & Message | Error
export type WriteResult = { type: 'writeResult', bytesWritten: number } & Message | Error

// union-ed core message that are useful sometimes
export type ReadWrite = SendByte | Read | Write | ReadBlock | WriteBlock
export type Result = ReadResult | WriteResult | Success | Error
