export type Message = { type: string, opaque?: string }

export type Addressed = { bus: number, address: number } & Message
export type Command = { cmd: number } & Addressed
//export type WithBuffer = { buffer: ArrayBuffer }
export type WithBuffer = { buffer: Buffer }

export type SendByte = { type: 'sendByte', byte: number } & Addressed
export type Read = { type: 'read', length: number } & Addressed
export type Write = { type: 'write' } & WithBuffer & Addressed

export type ReadBlock = { type: 'readBlock', length: number } & Command
export type WriteBlock = { type: 'writeBlock' } & WithBuffer & Command

export type ReadResult = { type: 'readResult', bytesRead: number } & WithBuffer & Message | Error
export type WriteResult = { type: 'writeResult', bytesWritten: number } & Message | Error

export type Error = { type: 'error', why: string } & Message
export type Success = { type: 'success' } & Message

export type ReadWrite = SendByte | Read | Write | ReadBlock | WriteBlock
export type Result = ReadResult | WriteResult | Success | Error


