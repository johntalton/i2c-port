
const enableEncoding = true

// on the web we have access to `btoa` and `atob` and `ArrayBuffer`
export class MessageTransform {

  static messageToStringMessage(message) {
    function arrayBufferToBase64(ab) {
      const binStr = String.fromCharCode(...new Uint8Array(ab))
      return btoa(binStr)
    }

    if(message.buffer !== undefined) {
      if(!enableEncoding) { return JSON.stringify({ ...message, buffer: message.buffer.toString() }) }

      const buffer = arrayBufferToBase64(message.buffer)
      return JSON.stringify({ ...message, buffer })
    }

    return JSON.stringify(message)
  }

  static stringMessageToMessage(message) {
    function base64ToArrayBuffer(base64) {
      console.log('b64', base64)
      const binary_string = atob(base64)
      const bytes = Uint8Array.from([...binary_string].map(c => c.charCodeAt(0)))
      return bytes.buffer
    }

    const msg = JSON.parse(message)

    if(msg.buffer !== undefined) {
      if(!enableEncoding) { return { ...msg, buffer: msg.buffer.split(',').map(y => parseInt(y, 10)) } }

      const buffer = base64ToArrayBuffer(msg.buffer)
      return { ...msg, buffer }
    }

    return msg
  }
}
