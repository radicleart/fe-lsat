import { Lsat } from 'lsat-js'
import store from '@/store'
import moment from 'moment'
import axios from 'axios'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'
import { LSAT_CONSTANTS } from '@/lsat-constants'
import _ from 'lodash'

const AUTHORIZATION = 'Authorization'
const API_PATH = process.env.VUE_APP_RADICLE_API
const ETH_RATE_PATH = process.env.VUE_APP_ETH_RATE_PATH2
const BTC_RATE_PATH = process.env.VUE_APP_BTC_RATE_PATH
let socket = null
let stompClient = null
const headers = function () {
  return store.getters[LSAT_CONSTANTS.GET_HEADERS]
}
const getPurchaseOrder = function (paymentChallenge) {
  const MYKEY = 'getTempUserId'
  const tuid = store.getters[MYKEY]
  return {
    status: 3,
    paymentId: paymentChallenge.paymentId,
    memo: 'product-id=' + paymentChallenge.paymentId,
    tuid: tuid,
    amountSat: paymentChallenge.xchange.amountSat,
    amountBtc: paymentChallenge.xchange.amountBtc
  }
}
const lsatHelper = {
  startListening (paymentId) {
    socket = new SockJS(API_PATH + '/lsat/ws1/mynews')
    stompClient = Stomp.over(socket)
    stompClient.connect({}, function () {
      stompClient.subscribe('/queue/mynews-' + paymentId, function (response) {
        const paymentChallenge = JSON.parse(response.body)
        store.commit('addPaymentChallenge', paymentChallenge)
      })
      stompClient.subscribe('/queue/rates', function (response) {
        const rates = JSON.parse(response.body)
        store.commit('addRates', rates)
      })
    },
    function (error) {
      console.log(error)
    })
  },
  stopListening (paymentId) {
    if (stompClient) stompClient.disconnect()
  },

  debugLsat (paymentChallenge, header) {
    if (!paymentChallenge.lsatInvoice) {
      console.log('no invoice present')
      return null
    }
    const lsat = Lsat.fromHeader(header)
    console.log('lsat', lsat)
    const macaroon = 'LSAT macaroon="' + paymentChallenge.lsatInvoice.token + '"'
    const fullMac = macaroon + ', invoice="' + paymentChallenge.lsatInvoice.paymentRequest + '"'
    console.log('fullMac', Lsat.fromHeader(fullMac))
    return Lsat.fromHeader(fullMac)
  },
  receivePayment (paymentChallenge) {
    return new Promise((resolve) => {
      const request = {
        method: 'put',
        url: API_PATH + '/lsat/v1/payment',
        headers: headers(),
        data: paymentChallenge
      }
      axios(request).then(response => {
        resolve(response.data)
      }).catch((error) => {
        resolve(error.response.data)
      })
    })
  },
  deleteExpiredPayment (paymentId) {
    return new Promise((resolve) => {
      const request = {
        method: 'delete',
        url: API_PATH + '/lsat/v1/payment/' + paymentId,
        headers: headers()
      }
      axios(request).then(response => {
        resolve(response.data)
      }).catch((error) => {
        resolve(error.response.data)
      })
    })
  },
  tokenChallenge (configuration) {
    return new Promise((resolve) => {
      // the payment challenge has been fullfilled - fetch the goodies..
      const paymentChallenge = store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      const token = localStorage.getItem('402-token-' + paymentChallenge.paymentId)
      const request = {
        method: 'post',
        url: API_PATH + configuration.purchaseEndpoint,
        headers: headers(),
        data: getPurchaseOrder(paymentChallenge)
      }
      request.headers[AUTHORIZATION] = 'LSAT ' + token
      axios(request).then(response => {
        resolve(response.data)
      }).catch((error) => {
        resolve(error.response.data)
      })
    })
  },
  challenge (paymentChallenge, configuration) {
    return new Promise((resolve, reject) => {
      const now = moment().valueOf()
      const expired = now > paymentChallenge.invoiceExpiry
      if (!expired) {
        resolve(paymentChallenge)
        return
      }
      const request = {
        method: 'post',
        url: API_PATH + configuration.purchaseEndpoint,
        headers: headers(),
        data: getPurchaseOrder(paymentChallenge)
      }
      request.headers[AUTHORIZATION] = null
      axios(request).then(response => {
        resolve(response.data)
      })
        .catch((error) => {
          if (error.response.status === 402) {
            const paymentChallenge = error.response.data
            paymentChallenge.lsat = lsatHelper.debugLsat(paymentChallenge, error.response.headers['www-authenticate'])
            resolve(paymentChallenge)
          } else {
            console.log('Problem calling endpoint ', error)
            resolve()
          }
        })
    })
  },
  checkPayment (paymentChallenge) {
    return new Promise((resolve) => {
      const token = lsatHelper.getToken(paymentChallenge.paymentId)
      if (token) {
        resolve(token)
        return
      }
      const request = {
        headers: headers()
      }
      if (paymentChallenge.paymentId) {
        request.method = 'get'
        request.url = API_PATH + '/lsat/v1/invoice/' + paymentChallenge.paymentId
      } else {
        request.method = 'post'
        request.url = API_PATH + '/lsat/v1/payment'
        request.data = paymentChallenge
      }
      axios(request).then(response => {
        if (typeof response.data === 'object') {
          resolve(response.data)
        } else {
          request.method = 'post'
          request.url = API_PATH + '/lsat/v1/payment'
          request.data = paymentChallenge
          axios(request).then(response => {
            resolve(response.data)
          })
        }
      })
    })
  },
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
  },
  lsatExpired (paymentChallenge) {
    if (!paymentChallenge.lsatInvoice || !paymentChallenge.lsatInvoice.paymentHash) {
      return false
    }
    var expiry = paymentChallenge.lsatInvoice.timestamp * 1000 + 3600000
    const expired = moment(expiry).isBefore(moment({}))
    return expired
  },
  lsatExpires (paymentChallenge) {
    var expires = paymentChallenge.lsatInvoice.timestamp * 1000 + 3600000
    return moment(expires).format('YYYY-MM-DD HH:mm')
  },
  lsatDuration (paymentChallenge) {
    if (!paymentChallenge.lsatInvoice || !paymentChallenge.lsatInvoice.paymentHash) {
      return {
        hours: 0, // duration.asHours(),
        minutes: 59,
        seconds: 59
      }
    }
    var expires = moment(paymentChallenge.lsatInvoice.timestamp * 1000 + 3600000)
    var duration = moment.duration(expires.diff(moment({})))
    var timeout = {
      hours: 0, // duration.asHours(),
      minutes: duration._data.minutes,
      seconds: duration._data.seconds
    }
    return timeout
  },
  storeToken (preimage, paymentChallenge) {
    if (!preimage) {
      return
    }
    const lsat = paymentChallenge.lsatInvoice
    const token = lsat.baseMacaroon + ':' + preimage
    localStorage.setItem('402-token-' + paymentChallenge.paymentId, token)
    return token
  },
  getToken (paymentId) {
    const token = localStorage.getItem('402-token-' + paymentId)
    return token
  }
}
export default lsatHelper
