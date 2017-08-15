#!/usr/bin/env node
'use strict'

const args = require('get-them-args')(process.argv.slice(2))
const CoinMarketCap = require('coinmarketcap-api')
const Table = require('cli-table')
const chalk = require('chalk')
const currencyConvert = require('currency-convert')

const DEFAULT_CURRENCY = 'USD'

const table = new Table({
  chars: {
    top: '',
    'top-mid': '',
    'top-left': '',
    'top-right': '',
    bottom: '',
    'bottom-mid': '',
    'bottom-left': '',
    'bottom-right': '',
    left: '',
    'left-mid': '',
    mid: '',
    'mid-mid': '',
    right: '',
    'right-mid': '',
    middle: ''
  }
})
const client = new CoinMarketCap()
const opts = {
  limit: args.limit || 20
}
const currency = args.currency || DEFAULT_CURRENCY

const formatCurrency = val => {
  return Number.parseFloat(val)
    .toFixed(2)
    .replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,')
}

const formatGrowth = val => {
  return val.indexOf('-') === -1 ? chalk.green(val) : chalk.red(val)
}

const formatRow = async (data = {}) => {
  let {
    name,
    symbol,
    rank,
    price_usd,
    market_cap_usd,
    '24h_volume_usd': volume_usd,
    available_supply,
    percent_change_1h,
    percent_change_24h,
    percent_change_7d
  } = data

  percent_change_1h = formatGrowth(percent_change_1h)
  percent_change_24h = formatGrowth(percent_change_24h)
  percent_change_7d = formatGrowth(percent_change_7d)

  price_usd = await currencyConvert(
    Number.parseFloat(price_usd),
    DEFAULT_CURRENCY,
    currency
  )
  market_cap_usd = await currencyConvert(
    Number.parseFloat(market_cap_usd),
    DEFAULT_CURRENCY,
    currency
  )
  available_supply = await currencyConvert(
    Number.parseFloat(available_supply),
    DEFAULT_CURRENCY,
    currency
  )
  volume_usd = await currencyConvert(
    Number.parseFloat(volume_usd),
    DEFAULT_CURRENCY,
    currency
  )

  return [
    rank,
    name,
    symbol,
    percent_change_1h,
    percent_change_24h,
    percent_change_7d,
    formatCurrency(price_usd),
    formatCurrency(market_cap_usd),
    formatCurrency(available_supply),
    formatCurrency(volume_usd)
  ]
}

const run = () => {
  client
    .getTicker(opts)
    .then((data = []) => {
      table.push(
        [
          '#',
          'Name',
          'Symbol',
          '% 1h',
          '% 24h',
          '% 7d',
          `Price (${currency})`,
          `Market Cap (${currency})`,
          `Circulating Supply (${currency})`,
          `Volume (24h/${currency})`
        ].map(val => chalk.bold(val))
      )

      Promise.all(data.map(formatRow))
        .then(result => {
          result.forEach(row => table.push(row))
          console.log(table.toString())
        })
        .catch(console.error)
    })
    .catch(console.error)
}

run()
