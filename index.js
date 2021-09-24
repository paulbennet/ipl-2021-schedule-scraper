#!/usr/bin/env node

const puppeteer = require('puppeteer')
const fse = require('fs-extra')
const path = require('path')
const { program } = require('commander')

const fetchResultsData = async () => {
  const browser = await puppeteer.launch({
    // DEBUG: For visually debugging the browser
    // headless: false,
    // devtools: true,
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

  const resultsURL = 'https://www.iplt20.com/matches/results/men/2021'

  page.setExtraHTTPHeaders({
    'X-PUPPETEER-ID': 'ipl-2021-schedule-scraper'
  })

  // NOTE: Fetch matches from results page
  await page.goto(resultsURL, {
    waitUntil: 'networkidle2',
    // Hopefully page should load before 20 secs
    timeout: 20000
  })

  await page.waitForTimeout(2000)

  let resultsJSON = null

  resultsJSON = await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const $ = window.$
      const events = []

      const getAbsURL = (relURL = '') => {
        return $('<a />').attr('href', relURL)[0].href
      }

      const sanitizeText = (text = '') => {
        return text.replace(/\n/gmi, '')
      }

      $('.js-match.match-list__item').each((index, element) => {
        const participants = []

        $(element).find('.result__team').each((teamIndex, teamElement) => {
          let teamID = $(teamElement).find('.result__logo.u-show-tablet.u-hide-phablet.tLogo40x').attr('class')
          teamID = teamID.replace('result__logo u-show-tablet u-hide-phablet tLogo40x', '').trim()

          const participant = {
            teamID,
            teamName: sanitizeText($(teamElement).find('.result__team-name').eq(0).text())
          }

          const scoreObj = $(teamElement).find('.result__score')

          const runsObj = ($(scoreObj).html().split('\n')[1].replace('<strong>', '').replace('</strong>', ''))

          const runs = runsObj.split('/')[0].replace(/\s/g, '')
          const wickets = runsObj.split('/')[1]

          const oversObj = $(scoreObj).find('.result__overs').text()

          const overs = sanitizeText(oversObj).replace(/\s/g, '')

          const isWinner = !($(teamElement).hasClass('result__team--loser'))

          if (isWinner) {
            participant.isWinner = true
          }
          participant.runs = runs
          participant.wickets = wickets
          participant.overs = overs.split('/')[0]

          participants.push(participant)
        }
        )

        let startTime = new Date(parseInt($(element).attr('data-timestamp')))

        startTime = startTime.toISOString()

        const infoElement = $(element).find('.result__info').eq(1)
        const matchNumber = sanitizeText($(infoElement).find('.result__description').text()).replace(/match /gmi, '')
        const matchID = $(element).attr('data-match-id')
        const venueID = $(element).attr('data-venue-id')

        const title = `🏏 ${participants[0].teamID} vs ${participants[1].teamID}`

        let location = sanitizeText(infoElement.get(0).childNodes[2].nodeValue).trim()

        location = location.split(',').slice(2).map((item) => {
          return item.trim()
        }
        ).join(', ').trim()

        const meta = {
          participants,
          matchNumber,
          matchID,
          venueID
        }

        if (participants[0].runs !== participants[1].runs) {
          const resultOutcome = $(element).find('.result__outcome').html()
          meta.outcome = `won${resultOutcome.split('won')[1]}`
        }

        events.push({
          startTime,
          location,
          title,
          link: getAbsURL($(element).find('.result__button.result__button--mc.btn').attr('href')),
          meta
        })
      }
      )

      resolve(events)
    })
  })

  await browser.close()

  return resultsJSON
}

const fetchSchedulesData = async () => {
  const schedulesURL = 'https://www.iplt20.com/matches/schedule/men'

  const browser = await puppeteer.launch({
    // DEBUG: For visually debugging the browser
    // headless: false,
    // devtools: true,
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

  page.setExtraHTTPHeaders({
    'X-PUPPETEER-ID': 'ipl-2021-schedule-scraper'
  })

  // NOTE: Fetch matches from schedules page
  await page.goto(schedulesURL, {
    waitUntil: 'networkidle2',
    // Hopefully page should load before 20 secs
    timeout: 20000
  })

  await page.waitForTimeout(2000)

  let schedulesJSON = null

  schedulesJSON = await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const $ = window.$

      const events = []

      const getAbsURL = (relURL = '') => {
        return $('<a />').attr('href', relURL)[0].href
      }

      const sanitizeText = (text = '') => {
        return text.replace(/\n/gmi, '')
      }

      $('.js-match.match-list__item').each((index, element) => {
        const participants = []

        $(element).find('.fixture__team').each((teamIndex, teamElement) => {
          const participant = {
            teamID: sanitizeText($(teamElement).find('.fixture__team-name--abbrv').text()),
            teamName: sanitizeText($(teamElement).find('.fixture__team-name').eq(0).text())
          }

          participants.push(participant)
        }
        )

        let startTime = new Date($(element).attr('data-timestamp'))

        startTime = startTime.toISOString()

        const infoElement = $(element).find('.fixture__info span')
        const matchNumber = sanitizeText($(infoElement).find('.fixture__description').text()).replace(/match /gmi, '')
        const matchID = $(element).attr('data-match-id')
        const venueID = $(element).attr('data-venue-id')

        const title = `${participants[0].teamName} 🆚 ${participants[1].teamName}`

        events.push({
          startTime,
          location: sanitizeText(infoElement.find('.fixture__description').get(0).parentNode.childNodes[1].nodeValue).trim(),
          title,
          link: getAbsURL($(element).find('.fixture__button.fixture__button--mc.btn').attr('href')),
          meta: {
            participants,
            matchNumber,
            matchID,
            venueID
          }
        })
      }
      )

      resolve(events)
    })
  })

  await browser.close()

  return schedulesJSON
}

const fetchPointsTableData = async () => {
  const schedulesURL = 'https://www.iplt20.com/points-table/men/2021'

  const browser = await puppeteer.launch({
    // DEBUG: For visually debugging the browser
    // headless: false,
    // devtools: true,
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

  page.setExtraHTTPHeaders({
    'X-PUPPETEER-ID': 'ipl-2021-schedule-scraper'
  })

  // NOTE: Fetch matches from schedules page
  await page.goto(schedulesURL, {
    waitUntil: 'networkidle2',
    // Hopefully page should load before 20 secs
    timeout: 20000
  })

  await page.waitForTimeout(2000)

  let pointsTableJSON = null

  pointsTableJSON = await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const $ = window.$

      const eventElems = $('.standings-table--full ').find('tbody')

      const teamPoints = []

      eventElems.find('tr').each((index, row) => {
        if (index !== 0) {
          const data = $(row).find('td')
          const teamObj = $(data[1]).find('a')

          let id = ''
          let name = ''

          $(teamObj[0]).find('.standings-table__team-name').each((teamNameIndex, teamName) => {
            if (teamNameIndex === 0) {
              name = $(teamName).text()
            } else {
              id = $(teamName).text()
            }
          })

          teamPoints.push({
            id,
            name,
            played: $(data[2]).text(),
            won: $(data[3]).text(),
            lost: $(data[4]).text(),
            tied: $(data[5]).text(),
            noResult: $(data[6]).text(),
            runRate: $(data[7]).text(),
            for: $(data[8]).text(),
            against: $(data[9]).text(),
            points: $(data[10]).text()
          })
        }
      })
      resolve(teamPoints)
    })
  })

  await browser.close()

  return pointsTableJSON
}

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

  const venues = {}
  const teams = {}
  const completedMatches = {}

  const pointsTableJSON = await fetchPointsTableData()
  const resultsJSON = await fetchResultsData()
  const schedulesJSON = await fetchSchedulesData()

  const pointsTableAsMap = pointsTableJSON.reduce((map = {}, pointsTableItem) => {
    map[pointsTableItem.id] = pointsTableItem
    return map
  }, {})

  const schedules = []

  resultsJSON.reverse().forEach((resultItem) => {
    completedMatches[resultItem.meta.matchID] = true

    venues[resultItem.meta.venueID] = resultItem.location

    resultItem.meta.participants.forEach((participant) => {
      if (participant.teamID === 'TBC') {
        return null
      }

      participant.points = pointsTableAsMap[participant.teamID].points

      teams[participant.teamID] = participant.teamName
    })

    schedules.push(resultItem)
  })

  schedulesJSON.forEach((matchItem) => {
    if (completedMatches[matchItem.meta.matchID]) {
      // To avoid duplicated matches between results & schedules page
      return null
    }

    venues[matchItem.meta.venueID] = matchItem.location

    matchItem.meta.participants.forEach((participant) => {
      if (participant.teamID === 'TBC') {
        return null
      }

      participant.points = pointsTableAsMap[participant.teamID].points

      teams[participant.teamID] = participant.teamName
    })

    let { matchNumber } = matchItem.meta
    matchNumber = parseInt(matchNumber)

    if (isNaN(matchNumber)) {
      matchItem.meta.matchType = (matchItem.meta.matchNumber).toUpperCase()
      matchItem.title = `${matchItem.meta.matchType} - ${matchItem.title}`
      delete matchItem.meta.matchNumber
    } else {
      matchItem.meta.matchNumber = matchNumber
    }

    schedules.push(matchItem)
  })

  const outputJSON = {
    venues,
    teams,
    points: pointsTableJSON,
    schedules
  }

  let outputFilePath = null

  outputFilePath = 'ipl-2021-schedule.json'

  fse.writeFileSync(path.join(outputDir, outputFilePath),
    JSON.stringify(outputJSON, null, 2))
}

mainProcess()
