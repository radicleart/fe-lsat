import store from '@/store'
import axios from 'axios'
import { LSAT_CONSTANTS } from '@/lsat-constants'
import _ from 'lodash'

const API_PATH = process.env.VUE_APP_API_RISIDIO
const ETH_RATE_PATH = process.env.VUE_APP_ETH_RATE_PATH2
const BTC_RATE_PATH = process.env.VUE_APP_BTC_RATE_PATH
const headers = function () {
  return store.getters[LSAT_CONSTANTS.GET_HEADERS]
}
const lsatHelper = {
  fetchRates () {
    return new Promise((resolve) => {
      const request = {
        method: 'get',
        url: API_PATH + BTC_RATE_PATH,
        headers: headers()
      }
      axios(request).then(response => {
        if (response && response.data) {
          const rates = response.data
          const request = {
            method: 'get',
            url: ETH_RATE_PATH
          }
          axios(request).then(response => {
            if (response && response.data) {
              let index = _.findIndex(response.data, function (o) {
                return o.symbol === 'ETHBTC'
              })
              let entry = response.data[index]
              const ethToBtcRate = { rate: Number(entry.weightedAvgPrice) }
              index = _.findIndex(response.data, function (o) {
                return o.symbol === 'STXBTC'
              })
              entry = response.data[index]
              const stxToBtcRate = { rate: Number(entry.weightedAvgPrice) }
              resolve({ bitcoinRates: rates, ethToBtcRate: ethToBtcRate, stxToBtcRate: stxToBtcRate })
            } else {
              resolve({ bitcoinRates: rates, ethToBtcRate: { rate: 0 } })
            }
          }).catch((e) => {
            resolve({ bitcoinRates: rates, ethToBtcRate: { rate: 0 } })
          })
        } else {
          resolve({ bitcoinRates: [], ethToBtcRate: { rate: 0 } })
        }
      })
    })
  }
}
export default lsatHelper
