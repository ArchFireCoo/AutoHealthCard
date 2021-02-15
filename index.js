const sendNotify = require('./scripts/sendNotify')
const browserSign = require('./scripts/browserSign')
const requestSign = require('./scripts/requestSign')
const logger = require('./scripts/logger')
const getTime = () => new Date().toLocaleString()

;(async () => {
  console.log(`==================脚本开始- 北京时间(UTC+8)：${getTime()}=====================`)
  let range = process.env.RANGE
  if (range) {
    logger.pushMessage('执行: requestSign')
    await requestSign()
  } else {
    logger.pushMessage('执行: browserSign')
    await browserSign()
  }
  sendNotify('HealthCard', logger.log)
  console.log(`==================脚本结束- 北京时间(UTC+8)：${getTime()}=====================`)
})()
