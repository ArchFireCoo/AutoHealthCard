const puppeteer = require('puppeteer-core')
// const axios = require('axios')

// const headers = {
//   Cookie: process.env.COOKIE,
// }

// const removeNullsInObject = (obj) => {
//   for (let key in obj) {
//     if (!obj[key]) {
//       delete obj[key]
//     }
//   }
//   return obj
// }

// const keysToLowerCase = (obj) => {
//   for (let key in obj) {
//     const lowercaseKey = key.toLowerCase()
//     if (key !== lowercaseKey) {
//       obj[lowercaseKey] = obj[key]
//       delete obj[key]
//     }
//   }
//   return obj
// }

// const getPersonalInfo = async () => {
//   try {
//     const response = await axios.get(
//       'https://work.jluzh.edu.cn/default/work/jlzh/jkxxtb/com.sudytech.work.jlzh.jkxxtb.jkxxcj.queryToday.biz.ext',
//       {
//         headers,
//       }
//     )

//     return response.data.result
//   } catch (error) {
//     console.error(error)
//   }
// }

// const submitHealthCard = async (data) => {
//   try {
//     const response = await axios.post(
//       'https://work.jluzh.edu.cn/default/work/jlzh/jkxxtb/com.sudytech.portalone.base.db.saveOrUpdate.biz.ext',
//       {
//         entity: {
//           ...data,
//           sfjwhygjdq: '',
//           cn: ['本人承诺登记后、到校前不再前往其他地区'],
//           bz: '',
//           _ext: '{}',
//           __type: 'sdo:com.sudytech.work.jlzh.jkxxtb.jkxxcj.TJlzhJkxxtb',
//         },
//       },
//       {
//         headers,
//       }
//     )
//     return response.data
//   } catch (error) {
//     console.error(error)
//   }
// }

// const start = async () => {
//   const info = await getPersonalInfo()
//   removeNullsInObject(info)
//   keysToLowerCase(info)
//   const result = await submitHealthCard(info)
//   console.log(result)
// }

const sleep = (time) => new Promise((res) => setTimeout(res, time * 1000))
const getTime = () =>
  new Date(
    new Date().getTime() +
      new Date().getTimezoneOffset() * 60 * 1000 +
      8 * 60 * 60 * 1000
  ).toLocaleString()

console.log(
  `==================脚本执行- 北京时间(UTC+8)：${getTime()}=====================\n`
)
;(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  })
  const page = await browser.newPage()
  await page.goto(
    'https://authserver.jluzh.edu.cn/cas/login?service=https%3A%2F%2Fmy.jluzh.edu.cn%2F_web%2Ffusionportal%2Fthings.jsp%3F_p%3DYXM9MSZwPTEmbT1OJg__'
  )
  await page.type('#username', process.env.USERNAME)
  await page.type('#password', process.env.PASSWORD)
  await page.click('#passbutton')
  await sleep(60)
  await page.click('a[title="健康卡填报"]')
  await sleep(60)
  const pages = await browser.pages()
  await pages[2].click('.action-btn.action-do')
  await sleep(120)
  const pages2 = await browser.pages()
  await pages2[3].click('.prompt_box_confirmText')
  await pages2[3].click('.prompt_box_nextBtn')
  await sleep(60)
  await pages2[3].click('.icheckbox_square-green')
  await pages2[3].click('#post')
  await sleep(60)
  await browser.close()

  console.log(
    `==================脚本结束- 北京时间(UTC+8)：${getTime()}=====================\n`
  )
})()
