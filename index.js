const puppeteer = require('puppeteer')
const player = require('play-sound')((opts = {}))

;(async () => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.setViewport({ width: 1366, height: 768 })
  await page.goto('https://onlinebusiness.icbc.com/webdeas-ui/home')
  await page.click('.mat-button-wrapper')
  const [lastNameField, licenseNumField, keywordField] = await page.$$(
    'div[class^="field"]'
  )
  await lastNameField.click()
  await lastNameField.type('') // your last name

  await licenseNumField.click()
  await licenseNumField.type('') // your license number

  await keywordField.click()
  await keywordField.type('') // your keyword

  await page.click('div.mat-checkbox-inner-container')
  const [cancelBtn, signInBtn] = await page.$$('button')
  await signInBtn.click()

  await page.waitForTimeout(2000)
  await page.waitForSelector('button')

  const buttons = await page.$$('button')

  const rescheduleBtn = buttons[3]
  const rescheduleBtnText = await page.evaluate(
    (btn) => btn.textContent,
    rescheduleBtn
  )

  if (!rescheduleBtnText.toLowerCase().includes('reschedule'))
    throw new Error('wrong button')

  await rescheduleBtn.click()

  const [_, yesBtn] = await page.$$('div.dialog button')
  yesBtn.click()
  await page.waitForNavigation()
  const addrInputField = await page.$('#mat-input-3')

  await addrInputField.type('burnaby', { delay: 200 })
  await page.waitForSelector('.mat-option-text')
  const burnabyOption = await page.$('.mat-option-text')

  const burnabyOptionText = await page.evaluate(
    (btn) => btn.textContent,
    burnabyOption
  )
  await burnabyOption.click()
  if (!burnabyOptionText.toLowerCase().includes('burnaby'))
    throw new Error('wrong city')

  const searchBtn = await page.$(
    '#search-dialog > app-search-modal > div > div > form > div.search-action.mat-dialog-actions.ng-star-inserted > button'
  )

  await searchBtn.click()
  await page.waitForSelector('.department-container')
  const departments = await page.$$('.department-container')

  let index = 0
  while (true) {
    const department = departments[index++]
    if (index === departments.length - 4) index = 0
    const locationContainer = await department.$('.department-title')
    const location = await page.evaluate(
      (locationContainer) => locationContainer.innerText,
      locationContainer
    )
    await page.waitForTimeout(1000)
    await department.click()
    await page.waitForFunction(() => !document.querySelector('.searching'))
    const hasAvailability = await page.$$eval('.date-title', (elements) =>
      elements.some((el) => el.textContent.includes('May'))
    )
    console.log({ location, hasAvailabilityForMay: hasAvailability })

    if (!hasAvailability) {
      await page.waitForSelector(
        'app-eligible-tests > div > div.actions.actions-container.mat-dialog-actions > button'
      )
      const backBtn = await page.$(
        'app-eligible-tests > div > div.actions.actions-container.mat-dialog-actions > button'
      )
      backBtn.click()
    } else {
      console.log(`found it! ${location}`)
      player.play('sounds/audio.mp3', function (err) {
        if (err) throw err
      })

      break
    }
  }
})()
