const got = require('got')
const { CookieJar } = require('tough-cookie')
const cheerio = require('cheerio')
const qs = require('qs')
const asyncLimit = require('j-async')
const { keysToLowerCase, datePadZero, concatRangeArr, createCurry } = require('./utils')
const { pushMessage } = require('./logger')

const headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36',
}

const api = {
  login: 'https://authserver.jluzh.edu.cn/cas/login',
  healthCard: 'https://work.jluzh.edu.cn/default/work/jlzh/jkxxtb/jkxxcj.jsp',
  getHealthData:
    'https://work.jluzh.edu.cn/default/work/jlzh/jkxxtb/com.sudytech.work.jlzh.jkxxtb.jkxxcj.queryToday.biz.ext',
  submitHealthCard:
    'https://work.jluzh.edu.cn/default/work/jlzh/jkxxtb/com.sudytech.portalone.base.db.saveOrUpdate.biz.ext',
  checkSignInStatus:
    'https://work.jluzh.edu.cn/default/work/jlzh/jkxxtb/com.sudytech.portalone.base.db.queryBySqlWithoutPagecond.biz.ext',
  queryToday: 'com.sudytech.work.jlzh.jkxxtb.jkxxcj.queryToday',
  queryNear: 'com.sudytech.work.jlzh.jkxxtb.jkxxcj.queryNear',
}

const loginDataTmp = {
  _eventId: 'submit',
  loginType: '1',
  submit: '登  录',
}

const cookieJar = new CookieJar()

let customGot = got.extend({
  headers,
  cookieJar,
})

let failStudentIdList = []

const getSignInRecord = async (studentID, isToday = false) => {
  const response = await customGot(api.checkSignInStatus, {
    method: 'POST',
    json: { params: { empcode: studentID }, querySqlId: isToday ? api.queryToday : api.queryNear },
  })

  return {
    recordList: response.body.list,
    recordLength: response.body.list.length,
  }
}

const checkSignInStatus = async (studentID, prevRecordLength = 0) => {
  try {
    const isToday = !prevRecordLength
    const { recordLength } = await getSignInRecord(studentID, isToday)
    const isSignIn = recordLength > 0
    const isNewRecord = recordLength > prevRecordLength

    console.log(`检查填报状态Success: 学号: ${studentID}`)

    return isToday ? isSignIn : isNewRecord
  } catch (error) {
    console.error(error)
    new Error(`检查填报状态Failure: 学号: ${studentID}, Cookie出错`)
  }
}

const getHealthData = async (studentID) => {
  try {
    const { recordList, recordLength } = await getSignInRecord(studentID, false)

    console.log(`获取健康数据Success: 学号: ${studentID}`)

    return {
      data: recordList[0],
      recordLength,
    }
  } catch (error) {
    console.log(error)
    new Error(`获取健康数据Failure: 学号: ${studentID}, Cookie出错`)
  }
}

const constructHealthData = (data, date) => {
  date = date || new Date()
  const currentDateArr = date.toLocaleDateString().split('/')

  if (process.env.ISACTION) {
    currentDateArr.reverse()
    currentDateArr[1] = currentDateArr.splice(2, 1, currentDateArr[1])[0]
  }

  const currentDate = currentDateArr.map(datePadZero).join('-')
  const currentHour = datePadZero(date.getHours())
  const currentMinute = datePadZero(date.getMinutes())

  keysToLowerCase(data)

  const result = {
    entity: {
      ...data,
      bt: `${currentDate}${data.bt.slice(10)}`,
      tbrq: currentDate,
      tjsj: `${currentDate} ${currentHour}:${currentMinute}`,
      cn: ['本人承诺登记后、到校前不再前往其他地区'],
      _ext: '{}',
      __type: 'sdo:com.sudytech.work.jlzh.jkxxtb.jkxxcj.TJlzhJkxxtb',
    },
  }
  delete result.entity.id

  return result
}

const submitHealthCard = async (studentID, healthData, date) => {
  try {
    await customGot(api.submitHealthCard, {
      json: constructHealthData(healthData.data, date),
    })
    const isSignIn = await checkSignInStatus(studentID, date && healthData.recordLength)

    if (!isSignIn) throw ''

    console.log(`填报Success: 学号: ${studentID}`)
  } catch (error) {
    console.error(error)
    throw new Error(`填报Failure: 学号: ${studentID}`)
  }
}

const execSign = async (studentID, date) => {
  try {
    if (!date) {
      const isSignIn = await checkSignInStatus(studentID)
      if (isSignIn) {
        console.log(`学号: ${studentID}, 今天已填报，取消填报`)
        return
      }
    }

    const studentHealthData = await getHealthData(studentID)
    await submitHealthCard(studentID, studentHealthData, date)
  } catch (error) {
    console.log(error)
    failStudentIdList.push(studentID)
  }
}

const execDateSign = async (studentIDList, date) => {
  const { LIMIT } = process.env
  const execSignByDate = createCurry(execSign, date)
  failStudentIdList = []

  pushMessage(`当前填报日期: ${date.toLocaleDateString()}`)

  await asyncLimit(studentIDList, execSignByDate, +LIMIT || 1)

  pushMessage(`失败列表: ${failStudentIdList}, 总计: ${failStudentIdList.length}`)
}

const login = async (username, password) => {
  const loginPageResponse = await customGot(api.login)
  const $ = cheerio.load(loginPageResponse.body)
  const execution = $('input[name="execution"]').attr('value')

  const loginResponse = await customGot(api.login, {
    method: 'POST',
    body: qs.stringify({ ...loginDataTmp, username, password, execution }),
  })

  if (!cheerio.load(loginResponse.body)('div.success').html()) {
    pushMessage('登入失败')
    process.exit(1)
  }

  pushMessage('登入成功')

  await customGot(api.healthCard)

  customGot = customGot.extend({
    headers: { 'content-type': 'application/json' },
    responseType: 'json',
  })
}

const startUp = async () => {
  const { USERNAME1, PASSWORD, RANGE, LIMIT, DATE_RANGE } = process.env
  await login(USERNAME1, PASSWORD)
  const studentIDList = concatRangeArr(RANGE.split(','))

  pushMessage(`填报列表: ${studentIDList}, 总计: ${studentIDList.length}`)

  if (DATE_RANGE) {
    const dateRange = concatRangeArr(DATE_RANGE.split(','), true)
    const execDateSignBind = execDateSign.bind(null, studentIDList)

    pushMessage(`检测到日期范围: ${dateRange.map((date) => date.toLocaleDateString())}`)

    await asyncLimit(dateRange, execDateSignBind, 1)
    return studentIDList * dateRange.length
  } else {
    await asyncLimit(studentIDList, execSign, +LIMIT || 1)
    pushMessage(`失败列表: ${failStudentIdList}, 总计: ${failStudentIdList.length}`)
  }
}

module.exports = startUp
