let logRef = {
  log: '',
}

const logger = (message) => {
  logRef.log += `${message}\n\n`
  console.log(message)
}

module.exports = {
  logRef,
  logger,
}
