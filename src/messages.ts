export type NodeLikeBuffer = Uint8Array | Uint8ClampedArray | Buffer
export type WebLikeBuffer = ArrayBuffer
export type PortBuffer =  NodeLikeBuffer

export type WithNamespace = { namespace: string | '' }
export type WithType = { type: string }
export type WithOpaque = { opaque?: string }
export type WithAddress = { bus: number, address: number }
export type WithCommand = { cmd: number } & WithAddress
export type WithBuffer = { buffer:  PortBuffer }
export type WithInBuffer = { buffer?: PortBuffer }
export type WithResultBuffer = { buffer: PortBuffer }
export type WithLength = { length: number }
export type WithOutLength = { length?: number }

export type Message = WithNamespace & WithOpaque & WithType & WithAddress

// core request message
export type SendByte =   { type: 'sendByte', byte: number } & Message
export type Read =       { type: 'read' } & WithInBuffer & WithLength & Message
export type Write =      { type: 'write' } & WithBuffer & WithOutLength &  Message
export type ReadBlock =  { type: 'readBlock' } & WithInBuffer & WithLength & WithCommand & Message
export type WriteBlock = { type: 'writeBlock' } & WithBuffer & WithOutLength & WithCommand & Message

// core results
export type ReadResult = { type: 'readResult', bytesRead: number } & WithResultBuffer & Message | Error
export type WriteResult = { type: 'writeResult', bytesWritten: number } & Message | Error

// misc
export type Error = { type: 'error', why: string } & Message
export type Success = { type: 'success' } & Message

// union-ed core message that are useful sometimes
export type ReadWrite = SendByte | Read | Write | ReadBlock | WriteBlock
export type Result = ReadResult | WriteResult | Success | Error
