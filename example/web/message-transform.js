
// on the web we have access to `btoa` and `atob` and `ArrayBuffer`
export class MessageTransform {

  static messageToStringMessage(message) {
    function arrayBufferToBase64(ab) {
      const binStr = String.fromCharCode(...new Uint8Array(ab))
      return btoa(binStr)
    }

    if (message.buffer !== undefined) {
      const buffer = arrayBufferToBase64(message.buffer)
      return JSON.stringify({ ...message, buffer })
    }

    return JSON.stringify(message)
  }

  static stringMessageToMessage(message) {
    function base64ToArrayBuffer(base64) {
      const binary_string = atob(base64);
      const bytes = Uint8Array.from([...binary_string].map(c => c.charCodeAt(0)))
      return bytes.buffer
    }

    const msg = JSON.parse(message)

    if (msg.buffer !== undefined) {
      const buffer = base64ToArrayBuffer(msg.buffer)
      return { ...msg, buffer }
    }

    return msg
  }
}
