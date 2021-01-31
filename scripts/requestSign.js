const axios = require('axios')
const request = require('request')
const cheerio = require('cheerio')
const qs = require('qs')
const asyncLimit = require('j-async')
const { keysToLowerCase, datePadZero, generateRangeArr } = require('./utils')
const { logger } = require('./logger')

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

const checkSignInStatus = async (studentID, isToday = true) => {
  try {
    const response = await axios.post(
      api.checkSignInStatus,
      { params: { empcode: studentID }, querySqlId: isToday ? api.queryToday : api.queryNear },
      {
        headers: headers,
      },
    )

    const list = response.data.list
    const conditionStr = isToday ? '天' : '最近'
    const isSignIn = list.length > 0

    isToday
      ? logger(`检查填报状态Success: 学号: ${studentID}, 查询条件: ${conditionStr}, 记录: ${list.length}`)
      : logger(`获取健康数据Success: 学号: ${studentID}, 查询条件: ${conditionStr}, 记录: ${list.length}`)

    isToday && isSignIn && logger(`学号: ${studentID}, 今天已填报，取消填报`)

    return {
      isSignIn,
      data: list[0],
    }
  } catch (error) {
    console.error(error)
    throw isToday
      ? new Error(`检查填报状态Failure: 学号: ${studentID}, Cookie出错`)
      : new Error(`获取健康数据Failure: 学号: ${studentID}, Cookie出错`)
  }
}

const getHealthData = async (studentID) => {
  const { data } = await checkSignInStatus(studentID, false)
  return data
}

const constructHealthData = (data) => {
  const date = new Date()
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

const submitHealthCard = async (studentID, data) => {
  try {
    const response = await axios.post(api.submitHealthCard, constructHealthData(data), {
      headers: headers,
    })

    if (response.data.result != 1) throw new Error()
    logger(`填报Success: 学号: ${studentID}`)
  } catch (error) {
    console.error(error)
    throw new Error(`填报Failure: 学号: ${studentID}`)
  }
}

const execSign = async (studentID) => {
  try {
    const { isSignIn } = await checkSignInStatus(studentID)
    if (isSignIn) return
    const studentHealthData = await getHealthData(studentID)
    await submitHealthCard(studentID, studentHealthData)
  } catch (error) {
    logger(error)
  }
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
    logger('登入失败')
    process.exit(1)
  }

  headers.Cookie = loginResponse.headers['set-cookie'][2]
  logger('登入成功')

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
        logger(`获取Cookie成功`)
        resolve()
      },
    )
  })
}

const generateStudentIDList = (rangeArr) =>
  rangeArr.reduce((prev, cur) => {
    const range = cur.split(':')
    const padStr = range[0][0] === '0' ? '0' : ''
    return prev.concat(generateRangeArr(+range[0], +range[1], padStr))
  }, [])

const startUp = async () => {
  const { USERNAME, PASSWORD, RANGE, LIMIT } = process.env
  const studentIDList = generateStudentIDList(RANGE.split(','))
  await login(USERNAME, PASSWORD)
  await asyncLimit(studentIDList, execSign, +LIMIT || 1)
  return studentIDList.length
}

module.exports = startUp
