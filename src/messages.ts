export type PortBuffer = ArrayBufferLike | ArrayBufferView
export type Address = number

export type WithNamespace = { namespace: string | '' }
export type WithType = { type: string }
export type WithOpaque = { opaque?: string }

export type Message = WithNamespace & WithOpaque & WithType

//
export type WithAddress = { address: Address }
export type WithCommand = { cmd: number } & WithAddress
export type WithBuffer = { buffer: PortBuffer }
export type WithInBuffer = { buffer?: PortBuffer }
export type WithResultBuffer = { buffer: PortBuffer }
export type WithLength = { length: number }
export type WithOutLength = { length?: number }

// misc
export type Error = { type: 'error', why: string } & Message
export type Success = { type: 'success' } & Message

// core request message
export type SendByte = { type: 'sendByte', byteValue: number }  & WithAddress & Message
export type Read = { type: 'i2cRead' }  & WithAddress & WithInBuffer & WithLength & Message
export type Write = { type: 'i2cWrite' } & WithAddress & WithBuffer & WithOutLength & Message
export type ReadBlock = { type: 'readI2cBlock' } & WithInBuffer & WithLength & WithCommand & Message
export type WriteBlock = { type: 'writeI2cBlock' } & WithBuffer & WithOutLength & WithCommand & Message
//
export type Scan = { type: 'scan' } & Message

// core results
export type ReadResult = { type: 'readResult', bytesRead: number } & WithResultBuffer & Message | Error
export type WriteResult = { type: 'writeResult', bytesWritten: number }  & Message | Error
//
export type ScanResult = { type: 'scanResult', addresses: ArrayLike<Address> } & Message | Error

// union-ed core message that are useful sometimes
export type Request = Scan | SendByte | Read | Write | ReadBlock | WriteBlock
export type Result = ScanResult | ReadResult | WriteResult | Success | Error
