let log = ''

const pushMessage = (message) => {
  exports.log += `${message}\n\n`
  console.log(message)
}

exports.log = log
exports.pushMessage = pushMessage
