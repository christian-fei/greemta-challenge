#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const csv = require('fast-csv')
const districtsInfo = require('./../data/districts-info.json')

main().catch(err => console.error(err))

async function main () {
  const csvOptions = { headers: true, delimiter: ',', ignoreEmpty: true, discardUnmappedColumns: true, trim: true }
  const districts = {}
  let processed = 0

  fs.createReadStream(path.resolve(__dirname, '..', 'datasets', 'trees', 'madrid_trees.csv'))
    .pipe(csv.parse(csvOptions))
    .on('error', error => console.error(error))
    // .on('data', Function.prototype)
    .on('data', tree => {
      if ([
        'DESAPARECIDO',
        'NO_PREPARADO',
        'NO PREPARADO',
        'INACTIVO'
      ].includes(tree.status)) return

      const district = tree.district.toLowerCase()
        // .split(/-/gi).map(capitalize).join('-')
        // .split(/ /gi).map(capitalize).join(' ')
        .replace('í', 'i').replace('á', 'a')
      districts[district] = districts[district] || { trees: 0 }
      districts[district].trees++
      processed++
      if (processed % 10000 === 0) {
        console.log(`processed ${processed}`)
        console.log(districts)
      }
    })
    .on('end', (rowCount) => {
      console.log(`Parsed ${rowCount} rows`)
      const array = Object.keys(districts).reduce((acc, curr) => {
        const info = districtsInfo.find(d => d.name.toLowerCase().startsWith(curr.toLowerCase()))
        if (!info) {
          console.log('info', info)
        }

        return acc.concat([{
          name: curr,
          trees: districts[curr].trees,
          population: info.population,
          area: info.area,
          density: info.density,
          treesPerCapita: districts[curr].trees / info.population,
          treesPerDensity: districts[curr].trees / info.density,
          treesPerArea: districts[curr].trees / info.area
        }])
      }, [])
      fs.writeFileSync(path.resolve(__dirname, '..', 'data', 'districts-trees.json'), JSON.stringify(array, null, 2), { encoding: 'utf-8' })
    })
}

function capitalize (s) {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}
// function sample (arr, size) {
//   const shuffled = arr.slice(0); let i = arr.length
//   let temp
//   let index
//   while (i--) {
//     index = Math.floor((i + 1) * Math.random())
//     temp = shuffled[index]
//     shuffled[index] = shuffled[i]
//     shuffled[i] = temp
//   }
//   return shuffled.slice(0, size)
//   /* https://stackoverflow.com/questions/11935175/sampling-a-random-subset-from-an-array */
// }

/*
CSV headers

common_name
objectid
description
id_lot
lot
id_district
district
id_neighborhood
neighborhood
classification_path
street_type
streetname
housenumber
direction_code
zipcode
serial_number
id_management_unit
management_unit
id_greenarea
greenarea
specie_abbreviation
specie_name
senescence
phenological_phase
interference_type
status
label
globalid
parent
crown_diameter
height
trunk_girth
longitude
latitude
*/
