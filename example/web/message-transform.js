

//
// this should be externalized (flexibility and validation),
// share with server side code (how)
//
export class MessageTransform {
  static portMessageToStringMessage(message) {
    const msg = message
    if(msg.buffer !== undefined) {
      msg.buffer = Buffer.from(message.buffer).toString('base64')
    }

    return JSON.stringify(msg)
  }

  static stringMessageToPortMessage(message) {
      const encodedMsg = JSON.parse(message)

      const msg = encodedMsg
      if(msg.buffer) {
        const buf = Buffer.from(msg.buffer, 'base64')
          .toString()
          .split()
          .map(b => b.charCodeAt(0))

        //console.log('decoding', buf)
        msg.buffer = Buffer.from(buf)
      }

      return msg
  }
}