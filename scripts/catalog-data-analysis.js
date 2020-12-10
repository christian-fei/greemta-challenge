#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const csv = require('fast-csv')

main().catch(err => console.error(err))

async function main () {
  const sectors = {}
  const names = []
  fs.createReadStream(path.resolve(__dirname, '..', 'datasets', 'catalog-data.csv'))
    .pipe(csv.parse({ headers: true, delimiter: ';', ignoreEmpty: true, discardUnmappedColumns: true, trim: true }))
    .on('error', error => console.error(error))
    // .on('data', Function.prototype)
    .on('data', row => {
      if (row.Sector) {
        sectors[row.Sector] = (sectors[row.Sector] || 0) + 1
      }
      names.push(row.Nombre)
    })
    .on('end', (rowCount) => {
      console.log(`Parsed ${rowCount} rows`)
      console.log('\nSectors:')
      console.log(Object.keys(sectors).join('\n'))
      console.log('\nData:')
      console.log(JSON.stringify(sectors, null, 2))
      console.log('\nNames:')
      console.log(names.join('\n'))
    })
}
