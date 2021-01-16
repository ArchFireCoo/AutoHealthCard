const puppeteer = require('puppeteer-core')

const sleep = (time) => new Promise((res) => setTimeout(res, time * 1000))
const getTime = () =>
  new Date(
    new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000,
  ).toLocaleString()

;(async () => {
  console.log(`==================脚本执行- 北京时间(UTC+8)：${getTime()}=====================`)

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  })

  try {
    const page = await browser.newPage()

    await page.goto(
      'https://authserver.jluzh.edu.cn/cas/login?service=https%3A%2F%2Fmy.jluzh.edu.cn%2F_web%2Ffusionportal%2Fthings.jsp%3F_p%3DYXM9MSZwPTEmbT1OJg__',
    )

    await page.type('#username', process.env.USERNAME1)
    await page.type('#password', process.env.PASSWORD)

    await Promise.all([
      page.click('#passbutton'),
      await page.waitForNavigation()
    ])

    if (page.url().includes('/cas/login')) throw new Error('账号或密码错误！')

    await page.goto('https://work.jluzh.edu.cn/default/work/jlzh/jkxxtb/jkxxcj.jsp')

    await page.waitForSelector('.prompt_box_confirmText', { visible: true })
    await page.click('.prompt_box_confirmText')
    await page.click('.prompt_box_nextBtn')
    await page.waitForSelector('.model', { hidden: true })
    await sleep(1)
    await page.click('.icheckbox_square-green')
    await page.click('#post')
    await page.waitForSelector('.layui-layer-content', { visible: true })

    const result = await page.$eval('.layui-layer-content', ele => ele.innerText)
    console.log(result)

    await browser.close()
  } catch (e) {
    console.error(e)
    await browser.close()
  }

  console.log(`==================脚本结束- 北京时间(UTC+8)：${getTime()}=====================`)
})()
