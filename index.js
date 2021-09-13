#!/usr/bin/env node

const puppeteer = require('puppeteer')
const fse = require('fs-extra')
const path = require('path')
const { program } = require('commander')

const mainProcess = async () => {
  program.option('-o --output-dir <output-dir>', 'Output directory path')

  program.parse(process.argv)

  let {
    outputDir
  } = program.opts()

  if (!outputDir) {
    console.error('Requires output-dir param')
    return
  }

  if (outputDir.startsWith('~/')) {
    outputDir = path.resolve(
      path.join(
        require('os').homedir(), outputDir.substring(2)
      )
    )
  }

  outputDir = path.resolve(outputDir)
  fse.mkdirpSync(outputDir)

  const browser = await puppeteer.launch({
    // DEBUG: For visually debugging the browser
    // headless: false,
    // Page content should take full viewport of browser
    defaultViewport: null
  })

  // Using the default opened page itself
  // const pages = await browser.pages()
  // const page = pages[0]

  const context = await browser.createIncognitoBrowserContext()
  const page = await context.newPage()

  // DEBUG: Setting UA to latest chrome
  // page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36')

  let pageURL = null

  pageURL = 'https://www.iplt20.com/matches/schedule/men'

  await page.goto(pageURL, {
    waitUntil: 'networkidle2',
    // Hopefully page should load before 20 secs
    timeout: 20000
  })

  await page.waitForTimeout(2000)

  let outputJSON = null

  outputJSON = await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const $ = window.$

      const getAbsURL = (relURL) => {
        return $('<a />').attr('href', relURL)[0].href
      }

      const events = []

      let lastEventStartTime

      $('.clickable-schedule-row').each((index, element) => {
        const participants = []

        $(element).find('.schedule-event .col-sm-6:nth(1) .playerTag').each((playerIndex, playerElement) => {
          const participant = {
            countryID: $(playerElement).attr('country'),
            countryName: $(playerElement).find('.country .noc').attr('title'),
            countryFlag: getAbsURL($(playerElement).find('.country .flag').attr('src')),
            name: ($(playerElement).find('.name span:nth(1)').text() || $(playerElement).find('.name').text()).replace(/\n/gmi, '')
          }

          const medal = ($(playerElement).parent().prev('.MedalBoxSmall').find('img').attr('alt') || '').replace('Medal', '').trim().toUpperCase()

          if (medal) {
            participant.medal = medal
          }

          const score = $(playerElement).closest('.row').find('.resultContainer .result').text().replace(/\n/gmi, '')

          if (score) {
            participant.score = score

            if ($(playerElement).closest('.row').find('.resultContainer.winner').length) {
              participant.isWinner = true
            }
          }

          participants.push(participant)
        }
        )

        let startTime = $(element).find('.schedule-time-data').attr('full-date')

        if (!startTime && $(element).find('.schedule-time').text().replace(/\n/gmi, '').toUpperCase() === 'FOLLOWED BY') {
          startTime = lastEventStartTime
        }

        lastEventStartTime = startTime

        const medalEventType = (
          $(element).find('.schedule-event .col-sm-6:nth(0) img.medal').attr('title') || ''
        ).replace('Medal Event', '').trim().toUpperCase()

        const meta = {
          sportID: $(element).attr('sport'),
          sportName: $($(element).parents('.schedule-container').parents('div').prev('.schedule-day-header').find('a')[0]).text().replace(/\n/gmi, ''),
          sportLogo: getAbsURL($(element).parents('.schedule-container').parents('div').prev('.schedule-day-header').find('.sport-icon').attr('src')),
          status: $(element).find('.schedule-status').text().replace(/\n/gmi, '').toUpperCase(),
          participants
        }

        if (medalEventType) {
          meta.medalType = medalEventType
        }

        events.push({
          startTime,
          location: $(element).find('.schedule-venue').text().replace(/\n/gmi, ''),
          title: $(element).find('.schedule-event .col-sm-6:nth(0) a').text().replace(/\n/gmi, ''),
          link: getAbsURL($(element).attr('data-url')),
          meta
        })
      }
      )

      resolve(events)
    })
  })

  let outputFilePath = null

  outputFilePath = 'ipl-schedule.json'

  fse.writeFileSync(path.join(outputDir, outputFilePath),
    JSON.stringify(outputJSON, null, 2))

  await browser.close()
}

mainProcess()
