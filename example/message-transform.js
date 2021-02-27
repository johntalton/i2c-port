const atob = (data) => Buffer.from(data, 'base64').toString('ascii')
const btoa = (data) => Buffer.from(data).toString('base64')

function arrayBufferToBinaryString(ab) {
  // return String.fromCharCode.apply(null, new Uint16Array(buf))
  return String.fromCharCode(...new Uint8Array(ab))
}

function binaryStringToArrayBuffer(binaryString) {
  const buffer = Uint8Array.from([...binaryString].map(c => c.charCodeAt(0)))
  return buffer.buffer
}

export class MessageTransform {
  static encodeMessage(message) {
    if(message.buffer === undefined) { return JSON.stringify(message) }

    const buffer = btoa(arrayBufferToBinaryString(message.buffer))
    return JSON.stringify({ ...message, buffer })
  }

  static decodeMessage(encodedMessage) {
    const message = JSON.parse(encodedMessage)
    if(message.buffer === undefined) { return message }

    const binaryString = atob(message.buffer)
    const buffer = binaryStringToArrayBuffer(binaryString)

    return { ...message, buffer }
  }
}
