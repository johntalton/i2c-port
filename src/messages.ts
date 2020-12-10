export type WithNamespace = { namespace: string | '' }
export type WithType = { type: string }
export type WithOpaque = { opaque?: string }
export type WithAddress = { bus: number, address: number }

export type WithCommand = { cmd: number } & WithAddress
export type WithNodeBuffer = { buffer: Buffer | Uint8Array | Uint8ClampedArray }
export type WithArrayBuffer = { buffer: ArrayBuffer }
export type WithBuffer = WithNodeBuffer

export type Message = WithNamespace & WithOpaque & WithType & WithAddress

export type SendByte = { type: 'sendByte', byte: number } & Message
export type Read = { type: 'read', length: number } & Message
export type Write = { type: 'write' } & WithBuffer & Message

export type ReadBlock = { type: 'readBlock', length: number } & WithCommand & Message // WithReadBuffer
export type WriteBlock = { type: 'writeBlock' } & WithBuffer & WithCommand & Message

export type ReadResult = { type: 'readResult', bytesRead: number } & WithBuffer & Message | Error
export type WriteResult = { type: 'writeResult', bytesWritten: number } & Message | Error

export type Error = { type: 'error', why: string } & Message
export type Success = { type: 'success' } & Message

export type ReadWrite = SendByte | Read | Write | ReadBlock | WriteBlock
export type Result = ReadResult | WriteResult | Success | Error
