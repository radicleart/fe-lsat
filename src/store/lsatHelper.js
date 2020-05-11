import { Lsat } from 'lsat-js'
import store from '@/store'
import moment from 'moment'
import axios from 'axios'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'

const AUTHORIZATION = 'Authorization'
const API_PATH = process.env.VUE_APP_RADICLE_API
const ETH_RATE_PATH = process.env.VUE_APP_ETH_RATE_PATH
let socket = null
let stompClient = null
const headers = {
  // 'X-XSRF-TOKEN': VueCookies.get('XSRF-TOKEN'),
  'Content-Type': 'application/json'
}
const getPurchaseOrder = function (configuration) {
  const MYKEY = 'getTempUserId'
  const tuid = store.getters[MYKEY]
  return {
    status: 3,
    productId: configuration.productId,
    memo: 'product-id=' + configuration.productId,
    tuid: tuid,
    amountSat: configuration.value.amountSat,
    amountBtc: configuration.value.amountBtc
  }
}
const lsatHelper = {
  startListening (paymentHash) {
    socket = new SockJS(API_PATH + '/lsat/ws1/mynews')
    stompClient = Stomp.over(socket)
    stompClient.connect({}, function () {
      stompClient.subscribe('/queue/mynews-' + paymentHash, function (response) {
        const settledInvoice = JSON.parse(response.body)
        store.commit('addSettledInvoice', settledInvoice)
      })
      stompClient.subscribe('/queue/mynews-' + 'rates', function (response) {
        const rates = JSON.parse(response.body)
        store.commit('addRates', rates)
      })
    },
    function (error) {
      console.log(error)
    })
  },
  stopListening (productId) {
    if (stompClient) stompClient.disconnect()
  },
  challenge (configuration) {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('402-token-' + configuration.productId)
      const lsat = JSON.parse(localStorage.getItem('402-lsat-' + configuration.productId))
      if (!token && lsat && lsat.timeCreated && lsat.paymentHash) {
        const now = moment().valueOf()
        const expired = now > lsat.timeCreated + 3600000
        if (!expired) {
          resolve(lsat)
          return
        }
      }
      const request = {
        method: 'post',
        url: API_PATH + configuration.purchaseEndpoint,
        headers: headers,
        data: getPurchaseOrder(configuration)
      }

      if (token) {
        request.headers[AUTHORIZATION] = 'LSAT ' + token
      } else {
        request.headers[AUTHORIZATION] = null
      }
      axios(request).then(response => {
        resolve(response.data)
      })
        .catch((error) => {
          if (error.response.status === 402) {
            const header = error.response.headers['www-authenticate']
            const lsat = Lsat.fromHeader(header)
            localStorage.setItem('402-lsat-' + configuration.productId, JSON.stringify(lsat))
            lsatHelper.getNewBitcoinAddress(configuration).then((fallbackAddress) => {
              localStorage.setItem('402-btca-' + configuration.productId, fallbackAddress)
              resolve(lsat)
            })
          } else {
            console.log('Problem calling endpoint ', error)
            resolve()
          }
        })
    })
  },
  checkPayment (productId) {
    return new Promise((resolve) => {
      const token = lsatHelper.getToken(productId)
      if (token) {
        resolve(token)
        return
      }
      const lsat = lsatHelper.getLsat(productId)
      if (!lsat) {
        resolve()
        return
      }
      const request = {
        method: 'post',
        url: API_PATH + '/lsat/v1/invoice/' + lsat.paymentHash,
        headers: headers,
        data: null
      }
      axios(request).then(response => {
        if (response && response.data) {
          const invoice = response.data
          if (invoice.state === 'SETTLED' && invoice.preimage) {
            const token = lsatHelper.storeToken(invoice.preimage, productId)
            resolve(token)
          } else {
            resolve()
          }
        }
      })
    })
  },
  fetchRates (endpoint) {
    return new Promise((resolve) => {
      const request = {
        method: 'get',
        url: API_PATH + endpoint
      }
      axios(request).then(response => {
        if (response && response.data) {
          const rates = response.data
          store.commit('addRates', rates)
          const request = {
            method: 'get',
            url: ETH_RATE_PATH
          }
          axios(request).then(response => {
            if (response && response.data) {
              store.commit('addEthToBtc', response.data)
              resolve(rates)
            } else {
              resolve(rates)
            }
          }).catch((e) => {
            resolve()
          })
        } else {
          resolve()
        }
      })
    })
  },
  getNewBitcoinAddress (configuration) {
    return new Promise((resolve) => {
      const request = {
        method: 'get',
        url: API_PATH + '/lsat/v1/bitcoin-address/' + configuration.productId
      }
      axios(request).then(response => {
        if (response && response.data) {
          resolve(response.data)
        } else {
          resolve()
        }
      })
    })
  },
  lsatExpired (productId) {
    const lsat = JSON.parse(localStorage.getItem('402-lsat-' + productId))
    if (!lsat) {
      return true
    }
    var expires = moment(lsat.timeCreated + 3600000)
    return moment(expires).isBefore(moment({}))
  },
  lsatDuration (productId) {
    const lsat = JSON.parse(localStorage.getItem('402-lsat-' + productId))
    var expires = moment(lsat.timeCreated + 3600000)
    var duration = moment.duration(expires.diff(moment({})))
    var timeout = {
      hours: 0, // duration.asHours(),
      minutes: duration._data.minutes,
      seconds: duration._data.seconds
    }
    return timeout
  },
  storeToken (preimage, productId) {
    if (!preimage) {
      return
    }
    const lsat = JSON.parse(localStorage.getItem('402-lsat-' + productId))
    const token = lsat.baseMacaroon + ':' + preimage
    localStorage.setItem('402-token-' + productId, token)
    return token
  },
  getLsat (productId) {
    const lsat = JSON.parse(localStorage.getItem('402-lsat-' + productId))
    return lsat
  },
  getToken (productId) {
    const token = localStorage.getItem('402-token-' + productId)
    return token
  }
}
export default lsatHelper
