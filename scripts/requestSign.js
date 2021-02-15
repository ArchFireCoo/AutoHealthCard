const axios = require('axios')
const request = require('request')
const cheerio = require('cheerio')
const qs = require('qs')
const asyncLimit = require('j-async')
const { keysToLowerCase, datePadZero, concatRangeArr, createCurry } = require('./utils')
const { pushMessage } = require('./logger')

const headers = {
  Cookie: null,
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

const getSignInRecord = async (studentID, isToday = false) => {
  const response = await axios.post(
    api.checkSignInStatus,
    { params: { empcode: studentID }, querySqlId: isToday ? api.queryToday : api.queryNear },
    {
      headers: headers,
    },
  )

  return {
    recordList: response.data.list,
    recordLength: response.data.list.length,
  }
}

const checkSignInStatus = async (studentID, prevRecordLength = 0) => {
  try {
    const isToday = !prevRecordLength
    const { recordLength } = await getSignInRecord(studentID, isToday)
    const isSignIn = recordLength > 0
    const isNewRecord = recordLength > prevRecordLength

    pushMessage(`检查填报状态Success: 学号: ${studentID}`)

    return isToday ? isSignIn : isNewRecord
  } catch (error) {
    console.error(error)
    new Error(`检查填报状态Failure: 学号: ${studentID}, Cookie出错`)
  }
}

const getHealthData = async (studentID) => {
  try {
    const { recordList, recordLength } = await getSignInRecord(studentID, false)

    pushMessage(`获取健康数据Success: 学号: ${studentID}`)

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
    await axios.post(api.submitHealthCard, constructHealthData(healthData.data, date), {
      headers: headers,
    })
    const isSignIn = await checkSignInStatus(studentID, date && healthData.recordLength)

    if (!isSignIn) throw ''

    pushMessage(`填报Success: 学号: ${studentID}`)
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
        pushMessage(`学号: ${studentID}, 今天已填报，取消填报`)
        return
      }
    }

    const studentHealthData = await getHealthData(studentID)
    await submitHealthCard(studentID, studentHealthData, date)
  } catch (error) {
    pushMessage(error)
  }
}

const execDateSign = async (studentIDList, date) => {
  const { LIMIT } = process.env
  pushMessage(`当前填报日期: ${date.toLocaleDateString()}`)
  const execSignByDate = createCurry(execSign, date)
  await asyncLimit(studentIDList, execSignByDate, +LIMIT || 1)
}

const login = async (username, password) => {
  const j = request.jar()
  const loginPageResponse = await axios.get(api.login)
  const $ = cheerio.load(loginPageResponse.data)
  const execution = $('input[name="execution"]').attr('value')
  const data = qs.stringify({ ...loginDataTmp, username, password, execution })

  const loginResponse = await axios({
    url: api.login,
    method: 'POST',
    headers: headers,
    data,
  })

  if (!cheerio.load(loginResponse.data)('div.success').html()) {
    pushMessage('登入失败')
    process.exit(1)
  }

  headers.Cookie = loginResponse.headers['set-cookie'][2]
  pushMessage('登入成功')

  return new Promise((resolve, reject) => {
    request(
      {
        url: api.healthCard,
        method: 'GET',
        headers: headers,
        jar: j,
      },
      (err) => {
        if (err) reject(err)
        var cookies = j.getCookies(api.healthCard)
        headers.Cookie = cookies[0].cookieString()
        pushMessage(`获取Cookie成功`)
        resolve()
      },
    )
  })
}

const startUp = async () => {
  const { USERNAME1, PASSWORD, RANGE, LIMIT, DATERANGE } = process.env
  await login(USERNAME1, PASSWORD)
  const studentIDList = concatRangeArr(RANGE.split(','))

  if (DATERANGE) {
    const dateRange = concatRangeArr(DATERANGE.split(','), true)
    const execDateSignBind = execDateSign.bind(null, studentIDList)
    pushMessage(`检测到日期范围: ${dateRange.map((date) => date.toLocaleDateString())}`)
    await asyncLimit(dateRange, execDateSignBind, 1)
    return studentIDList * dateRange.length
  } else {
    await asyncLimit(studentIDList, execSign, +LIMIT || 1)
  }

  return studentIDList.length
}

module.exports = startUp
