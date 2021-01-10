const axios = require('axios')

const headers = {
  Cookie: process.env.COOKIE,
}

const removeNullsInObject = (obj) => {
  for (let key in obj) {
    if (!obj[key]) {
      delete obj[key]
    }
  }
  return obj
}

const keysToLowerCase = (obj) => {
  for (let key in obj) {
    const lowercaseKey = key.toLowerCase()
    if (key !== lowercaseKey) {
      obj[lowercaseKey] = obj[key]
      delete obj[key]
    }
  }
  return obj
}

const getPersonalInfo = async () => {
  try {
    const response = await axios.get(
      'https://work.jluzh.edu.cn/default/work/jlzh/jkxxtb/com.sudytech.work.jlzh.jkxxtb.jkxxcj.queryToday.biz.ext',
      {
        headers,
      }
    )

    return response.data.result
  } catch (error) {
    console.error(error)
  }
}

const submitHealthCard = async (data) => {
  try {
    const response = await axios.post(
      'https://work.jluzh.edu.cn/default/work/jlzh/jkxxtb/com.sudytech.portalone.base.db.saveOrUpdate.biz.ext',
      {
        entity: {
          ...data,
          sfjwhygjdq: '',
          cn: ['本人承诺登记后、到校前不再前往其他地区'],
          bz: '',
          _ext: '{}',
          __type: 'sdo:com.sudytech.work.jlzh.jkxxtb.jkxxcj.TJlzhJkxxtb',
        },
      },
      {
        headers,
      }
    )
    return response.data
  } catch (error) {
    console.error(error)
  }
}

const start = async () => {
  const info = await getPersonalInfo()
  removeNullsInObject(info)
  keysToLowerCase(info)
  const result = await submitHealthCard(info)
  console.log(result)
}

console.log(
  `==================脚本执行- 北京时间(UTC+8)：${new Date(
    new Date().getTime() +
      new Date().getTimezoneOffset() * 60 * 1000 +
      8 * 60 * 60 * 1000
  ).toLocaleString()}=====================\n`
)
start()
