#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const csv = require('fast-csv')
const sample = require('lodash.samplesize')

main().catch(err => console.error(err))

async function main () {
  const stats = {
    species: new Set(),
    statuses: new Set(),
    maxTreeHeight: undefined,
    minTreeHeight: undefined,
    maxTreeCrownDiameter: undefined,
    minTreeCrownDiameter: undefined,
    maxTreeTrunkGirth: undefined,
    minTreeTrunkGirth: undefined
  }

  const geojson = []

  const csvOptions = { headers: true, delimiter: ',', ignoreEmpty: true, discardUnmappedColumns: true, trim: true }
  // if (Number.isFinite(+process.argv[2])) {
  //   csvOptions.maxRows = +process.argv[2]
  // }

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

      tree.height = parseFloat(tree.height)
      tree.crown_diameter = parseFloat(tree.crown_diameter)
      tree.trunk_girth = parseFloat(tree.trunk_girth)

      stats.species.add(tree.specie_name)
      stats.statuses.add(tree.status)

      if (tree.height > stats.maxTreeHeight || stats.maxTreeHeight === undefined) stats.maxTreeHeight = tree.height
      if ((tree.height > 0 && tree.height < stats.minTreeHeight) || stats.minTreeHeight === undefined) stats.minTreeHeight = tree.height

      if (tree.crown_diameter > stats.maxTreeCrownDiameter || stats.maxTreeCrownDiameter === undefined) stats.maxTreeCrownDiameter = tree.crown_diameter
      if ((tree.crown_diameter > 0 && tree.crown_diameter < stats.minTreeCrownDiameter) || stats.minTreeCrownDiameter === undefined) stats.minTreeCrownDiameter = tree.crown_diameter

      if (tree.trunk_girth > stats.maxTreeTrunkGirth || stats.maxTreeTrunkGirth === undefined) stats.maxTreeTrunkGirth = tree.trunk_girth
      if ((tree.trunk_girth > 0 && tree.trunk_girth < stats.minTreeTrunkGirth) || stats.minTreeTrunkGirth === undefined) stats.minTreeTrunkGirth = tree.trunk_girth

      geojson.push({
        type: 'Feature',
        // properties: {
        //   name: tree.name,
        //   crown_diameter: tree.crown_diameter
        // },
        geometry: {
          type: 'Point',
          coordinates: [+tree.longitude, +tree.latitude]
        }
      })
    })
    .on('end', (rowCount) => {
      console.log(`Parsed ${rowCount} rows`)
      stats.species = [...stats.species]
      stats.statuses = [...stats.statuses]
      console.log(JSON.stringify(stats, null, 2))
      const sampled = sample(geojson, +process.argv[2] || 10000)
      const dataset = { type: 'FeatureCollection', features: sampled }
      fs.writeFileSync(path.resolve(__dirname, '..', 'data', 'tree-points.geojson'), JSON.stringify(dataset), { encoding: 'utf-8' })
    })
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
