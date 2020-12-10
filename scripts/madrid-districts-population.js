#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

main()

async function main () {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'data', 'districts-madrid.html'), { encoding: 'utf8' })
  const $ = cheerio.load(html)
  const districts = []
  $('.wikitable tbody > tr').each((i, el) => {
    const $tr = $(el)
    const $tds = $tr.find('td')
    const name = $tds.eq(1).text().trim().toLowerCase()
      // .split(/-/gi).map(capitalize).join('-')
      // .split(/ /gi).map(capitalize).join(' ')
      .replace('í', 'i').replace('á', 'a')
    if (!name) return
    const area = +$tds.eq(2).text().replace(',', '')
    const population = +$tds.eq(3).text().replace(',', '')
    const density = +$tds.eq(4).text().replace(',', '')
    districts.push({ name, area, population, density })
  })
  const jsonPath = path.resolve(__dirname, '..', 'data', 'districts-info.json')
  fs.writeFileSync(jsonPath, JSON.stringify(districts, null, 2), { encoding: 'utf-8' })
  console.log('written to ', jsonPath)
}

function capitalize (s) {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}
