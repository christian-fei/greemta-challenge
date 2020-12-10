#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const csv = require('fast-csv')
const findCenter = require('@turf/center').default

main().catch(err => console.error(err))

async function main () {
  const consumption = []
  const districts = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'data', 'districts.geojson'), { encoding: 'utf-8' }))

  const csvOptions = { headers: true, delimiter: ';', ignoreEmpty: true, discardUnmappedColumns: true, trim: true }

  fs.createReadStream(path.resolve(__dirname, '..', 'datasets', 'consumo_energia_edificios.csv'))
    .pipe(csv.parse(csvOptions))
    .on('error', error => console.error(error))
    .on('data', row => {
      // if (row.UNIDADES !== 'kWh') return
      // if (row.CLASE !== 'Energia activa') return
      if (row.CONSUMO.includes('NO') || !row.CONSUMO) return
      if (+row['A�O'] !== 2020) return

      const obj = {
        year: +row['A�O'],
        month: +row.MES,
        class: row.CLASE,
        district: row.DISTRITO
          .toLowerCase()
          .split(/-/).map(capitalize).join('-')
          .split(/ /).map(capitalize).join(' ')
          .replace('�', 'a'),
        type: row.TIPOEDIFICIO,
        latitude: parseFloat(row.LATITUD.replace(/\./gi, '')),
        longitude: parseFloat(row.LONGITUD.replace(/\./gi, '')),
        consumption: parseFloat(row.CONSUMO.replace(',', '.'))
      }
      obj.latitude = obj.latitude / Math.pow(10, `${obj.latitude}`.length - 2)
      obj.longitude = obj.longitude / Math.pow(10, `${obj.longitude}`.length - 2)
      consumption.push(obj)
    })
    .on('end', (rowCount) => {
      console.log(`Parsed ${rowCount} rows`)
      fs.writeFileSync(path.resolve(__dirname, '..', 'data', 'consumption-2020.json'), JSON.stringify(consumption), { encoding: 'utf-8' })
      const consumptionByDistrict = consumption.reduce((acc, curr) => {
        const key = curr.district
        if (acc[key]) return Object.assign(acc, { [key]: acc[key] + curr.consumption })
        return Object.assign(acc, {
          [key]: curr.consumption
        })
      }, {})
      fs.writeFileSync(path.resolve(__dirname, '..', 'data', 'consumption-by-district-2020.json'), JSON.stringify(consumptionByDistrict), { encoding: 'utf-8' })

      districts.features = districts.features.map(d => {
        const districtName = d.properties.name
        if (consumptionByDistrict[districtName]) {
          d.properties.consumption = consumptionByDistrict[districtName]
          d.properties.center = findCenter(d.geometry).geometry.coordinates
        }
        return d
      })
      fs.writeFileSync(path.resolve(__dirname, '..', 'data', 'consumption-by-district-2020.geojson'), JSON.stringify(districts), { encoding: 'utf-8' })
    })
}
function capitalize (s) {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/*
csv headers

A�O
MES
ID
TIPOEDIFICIO
EDIFICIO
DIRECCION
DISTRITO
BARRIO
COORDENADA-X
COORDENADA-Y
LONGITUD
LATITUD
SENSOR
TIPO
CLASE
GRUPO
UNIDADES
CONSUMO
*/
