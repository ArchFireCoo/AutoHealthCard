const puppeteer = require('puppeteer-core')
const { pushMessage } = require('./logger')

let count = 0
const sleep = (time) => new Promise((res) => setTimeout(res, time * 1000))

const startUp = () => {
  return new Promise((resolve) => {
    const execSign = async () => {
      pushMessage(`执行次数: ${++count}`)

      const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      })

      try {
        const page = await browser.newPage()

        await page.goto(
          'https://authserver.zcst.edu.cn/cas/login?service=https%3A%2F%2Fmy.zcst.edu.cn%2F_web%2Ffusionportal%2Fthings.jsp%3F_p%3DYXM9MSZwPTEmbT1OJg__',
        )

        await page.type('#username', process.env.USERNAME)
        await page.type('#password', process.env.PASSWORD)

        await Promise.all([
          page.click('#passbutton'),
          page.waitForNavigation({
            timeout: 60000,
          }),
        ])

        if (page.url().includes('/cas/login')) throw new Error('账号或密码错误！')

        await page.goto('https://work.zcst.edu.cn/default/work/jlzh/jkxxtb/jkxxcj.jsp')

        await page.waitForSelector('.prompt_box_confirmText', { visible: true })
        await page.click('.prompt_box_confirmText')
        await page.click('.prompt_box_nextBtn')
        await page.waitForSelector('.model', { hidden: true })
        await sleep(1)
        await page.click('.icheckbox_square-green')
        await page.click('#post')
        await page.waitForSelector('.layui-layer-content', { visible: true })

        const result = await page.$eval('.layui-layer-content', (ele) => ele.innerText)
        pushMessage(result)

        await browser.close()
        resolve()
      } catch (e) {
        pushMessage(e)
        if (e.message !== '账号或密码错误！' && count < 5) setTimeout(startUp, 1000)
        if (count === 5) resolve()
        await browser.close()
      }
    }
    execSign()
  })
}

module.exports = startUp
