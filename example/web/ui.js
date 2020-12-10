function ui_insert(message) {
  console.log('ui', message)

  let buffer = 'none'
  if (message.buffer) {
    const uint8 = new Uint8Array(message.buffer)
    buffer = [...uint8].map(b => '0x' + b.toString(16)).toString()
  }

  const listNode = document.getElementById("list")
  const liNode = document.createElement("LI")

  if(message.type === 'error') {
    liNode.innerText = `Opaque: ${message.opaque} Error: ${message.why}`
  } else {
    liNode.innerText = `Opaque: ${message.opaque} R/W: ${message.bytesRead ?? 0} / ${message.bytesWritten ?? 0} buffer: ${buffer}`
  }

  listNode.appendChild(liNode)
}