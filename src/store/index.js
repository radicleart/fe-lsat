import Vue from 'vue'
import Vuex from 'vuex'
import lsatHelper from './lsatHelper'
import ethereumStore from './ethereumStore'
import {
  UserSession,
  decodeToken
} from 'blockstack'
import authStore from '@/store/authStore'

Vue.use(Vuex)

const precision = 100000000
const userSession = new UserSession()
const authHeaders = function (configuration) {
  var authResponseToken
  var decodedToken
  var publicKey
  let token = 'v1:no-token' // note: not all requests require auth token - e.g. getPaymentAddress
  if (userSession.isUserSignedIn()) {
    const account = userSession.loadUserData()
    if (account) {
      authResponseToken = account.authResponseToken
      decodedToken = decodeToken(authResponseToken)
      publicKey = decodedToken.payload.public_keys[0]
      token = 'v1:' + account.authResponseToken
    }
  }
  const headers = {
    ApiKey: configuration.apiKey,
    IdentityAddress: publicKey,
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token
  }
  return headers
}
const getAmountSat = function (amountBtc) {
  try {
    if (typeof amountBtc === 'string') {
      amountBtc = Number(amountBtc)
    }
    return Math.round(amountBtc * precision)
  } catch {
    return 0
  }
}
const options = [{ text: 'Lightning', value: 'lightning' }, { text: 'Bitcoin', value: 'bitcoin' }, { text: 'Ether', value: 'ethereum' }, { text: 'Stacks', value: 'stacks' }]
const getPaymentOptions = function (paymentChallenge, configuration) {
  const allowedOptions = []
  options.forEach(function (option) {
    if (option.value === 'lightning' && paymentChallenge.lsatInvoice && paymentChallenge.lsatInvoice.paymentHash) {
      if (!configuration.paymentOptions || configuration.paymentOptions.allowLightning) {
        allowedOptions.push({ text: 'Lightning', value: 'lightning' })
      }
    } else if (option.value === 'bitcoin' && paymentChallenge.bitcoinInvoice && paymentChallenge.bitcoinInvoice.bitcoinAddress) {
      if (!configuration.paymentOptions || configuration.paymentOptions.allowBitcoin) {
        allowedOptions.push({ text: 'Bitcoin', value: 'bitcoin' })
      }
    } else if (option.value === 'ethereum') {
      if (!configuration.paymentOptions || configuration.paymentOptions.allowEthereum) {
        allowedOptions.push({ text: 'Ether', value: 'ethereum' })
      }
    } else if (option.value === 'stacks') {
      if (!configuration.paymentOptions || configuration.paymentOptions.allowStacks) {
        allowedOptions.push({ text: 'Stacks', value: 'stacks' })
      }
    }
  })
  return allowedOptions
}
const initPaymentChallenge = function (rateObject, creditAttributes) {
  let amountFiat = creditAttributes.amountFiatPerCredit
  if (creditAttributes.useCredits) {
    const start = (creditAttributes.start) ? creditAttributes.start : 2
    amountFiat = creditAttributes.amountFiatPerCredit * start
  }
  let amountBtc = amountFiat / rateObject.bitcoinRates[creditAttributes.fiatCurrency]['15m']
  amountBtc = Math.round(amountBtc * precision) / precision
  const pc = {
    paymentId: localStorage.getItem('402-payment-id'),
    xchange: {
      numbCredits: creditAttributes.start,
      fiatCurrency: creditAttributes.fiatCurrency,
      amountFiat: amountFiat,
      amountBtc: amountBtc,
      amountSat: getAmountSat(amountBtc),
      amountEth: Math.round((amountBtc / rateObject.ethToBtcRate.rate) * precision) / precision,
      amountStx: Math.round((amountBtc / rateObject.stxToBtcRate.rate) * precision) / precision
    },
    bitcoinInvoice: {},
    lsatInvoice: {}
  }
  return pc
}

export default new Vuex.Store({
  modules: {
    ethereumStore: ethereumStore,
    authStore: authStore
  },
  state: {
    authStore: authStore,
    configuration: null,
    rateObject: null,
    settledInvoice: null,
    tempUserId: false,
    invoice: null,
    headers: null,
    paymentChallenge: null,
    displayCard: 0,
    paymentOption: null,
    paymentOptions: []
  },
  getters: {
    getReturnState: state => data => {
      const result = {
        opcode: data.opcode,
        token: (data.token) ? data.token : state.paymentChallenge.lsatInvoice.token,
        status: (data.status) ? data.status : state.paymentChallenge.status,
        numbCredits: state.paymentChallenge.xchange.numbCredits,
        paymentId: state.paymentChallenge.paymentId
      }
      if (data.opcode === 'lsat-payment-confirmed') {
        result.lsat = lsatHelper.lsat
      }
      return result
    },
    getDisplayCard: (state) => {
      return state.displayCard
    },
    getCurrentPaymentOption: (state) => {
      return state.configuration.paymentOption
    },
    getPaymentOptions: state => {
      const paymentOptions = getPaymentOptions(state.paymentChallenge, state.configuration)
      return paymentOptions
    },
    getHeaders: state => {
      return state.headers
    },
    getConfiguration: state => {
      return state.configuration
    },
    getPaymentChallenge: state => {
      return state.paymentChallenge
    },
    getNumbCredits: state => {
      return state.paymentChallenge.xchange.numbCredits
    },
    getBitcoinAddress: state => {
      return state.paymentChallenge.bitcoinInvoice.bitcoinAddress
    },
    getLsat: state => {
      return state.paymentChallenge.lsatInvoice
    },
    getLsatExpired: state => {
      return lsatHelper.lsatExpired(state.paymentChallenge)
    },
    getLsatExpires: state => {
      return lsatHelper.lsatExpires(state.paymentChallenge)
    },
    getLsatDuration: state => {
      return lsatHelper.lsatDuration(state.paymentChallenge)
    },
    getToken: state => {
      const paymentId = localStorage.getItem('402-payment-id')
      const token = localStorage.getItem('402-token-' + paymentId)
      return token
    },
    getTempUserId: state => {
      if (state.tempUserId) {
        return JSON.parse(localStorage.getItem('RADICLE_TUID'))
      }
      return ''
    }
  },
  mutations: {
    addTempUserId (state) {
      const tuid = JSON.parse(localStorage.getItem('RADICLE_TUID'))
      if (!tuid) {
        const tuid = '_' + Math.random().toString(36).substr(2, 15)
        localStorage.setItem('RADICLE_TUID', JSON.stringify(tuid))
      }
      state.tempUserId = true
    },
    setDisplayCard (state, val) {
      state.displayCard = val
    },
    addPaymentChallenge (state, o) {
      if (!o) {
        o = {
          paymentId: localStorage.getItem('402-payment-id'),
          xchange: state.configuration.value,
          bitcoinInvoice: {},
          lsatInvoice: {}
        }
      }
      localStorage.setItem('402-payment-id', o.paymentId)
      state.paymentChallenge = o
    },
    addPaymentOption (state, o) {
      state.configuration.paymentOption = o
    },
    addPaymentOptions (state, o) {
      state.paymentOptions = getPaymentOptions(state.paymentChallenge, state.configuration)
      if (!state.configuration.paymentOption) {
        state.configuration.paymentOption = state.paymentOptions[0].value
      }
    },
    addRates (state, o) {
      state.rateObject.bitcoinRates = o
    },
    addHeaders (state, o) {
      state.headers = o
    },
    addRateObject (state, o) {
      state.rateObject = o
    },
    addPaymentConfig (state, configuration) {
      state.configuration = configuration
    }
  },
  actions: {
    reinitialiseApp ({ commit }, configuration) {
      const paymentId = localStorage.getItem('402-payment-id')
      localStorage.removeItem('402-token-' + paymentId)
      localStorage.removeItem('402-payment-id')
      return this.dispatch('initialiseApp', configuration)
    },
    initialiseApp ({ state, commit }, configuration) {
      const $self = this
      return new Promise((resolve, reject) => {
        if (!configuration.purchaseEndpoint) {
          configuration.purchaseEndpoint = '/assets/buy-now'
        }
        commit('addHeaders', authHeaders(configuration))
        commit('addPaymentConfig', configuration)
        $self.dispatch('fetchRates').then(() => {
          commit('addPaymentChallenge', initPaymentChallenge(state.rateObject, state.configuration.creditAttributes))
          if (configuration.opcode === 'lsat-place-order') {
            configuration.opcode = 'payment'
            commit('addPaymentConfig', configuration)
            resolve({ tokenAcquired: false, resource: state.paymentChallenge })
            return
          }
          lsatHelper.checkPayment(state.paymentChallenge).then((paymentChallenge) => {
            commit('addPaymentChallenge', paymentChallenge)
            if (paymentChallenge.lsatInvoice && paymentChallenge.lsatInvoice.state === 'SETTLED' && paymentChallenge.lsatInvoice.preimage) {
              lsatHelper.storeToken(paymentChallenge.lsatInvoice.preimage, paymentChallenge)
              lsatHelper.tokenChallenge(configuration).then((resource) => {
                resolve({ tokenAcquired: true, resource: resource })
              })
            } else if (paymentChallenge.status > 3) {
              resolve({ tokenAcquired: true })
            } else {
              commit('addPaymentChallenge', paymentChallenge)
              lsatHelper.challenge(paymentChallenge, configuration).then((lsatEnabledPC) => {
                commit('addPaymentOptions')
                if (lsatEnabledPC.paymentId && lsatEnabledPC.paymentId !== 'null') {
                  lsatHelper.startListening(lsatEnabledPC.paymentId)
                  commit('addPaymentChallenge', lsatEnabledPC)
                }
                if (lsatEnabledPC) {
                  commit('addPaymentChallenge', lsatEnabledPC)
                }
                resolve({ tokenAcquired: false, resource: state.paymentChallenge })
              })
            }
          })
        })
      })
    },
    receivePayment ({ state, commit }, paymentEvent) {
      return new Promise((resolve, reject) => {
        const pc = state.paymentChallenge
        pc.status = paymentEvent.status
        pc.etherInvoice.txId = paymentEvent.txId
        lsatHelper.receivePayment(pc).then((pc) => {
          commit('addPaymentChallenge', pc)
          resolve(pc)
        })
      })
    },
    deleteExpiredPayment ({ state, commit }) {
      return new Promise((resolve, reject) => {
        lsatHelper.deleteExpiredPayment(state.paymentChallenge.paymentId).then(() => {
          resolve()
        })
      })
    },
    updateAmount ({ state, commit }, data) {
      state.configuration.creditAttributes.start = data.numbCredits
      return this.dispatch('reinitialiseApp', state.configuration)
    },
    fetchRates ({ commit }) {
      return new Promise((resolve, reject) => {
        lsatHelper.fetchRates().then((rateObject) => {
          commit('addRateObject', rateObject)
          resolve()
        })
      })
    },
    startListening ({ state }) {
      if (state.paymentChallenge.paymentId && state.paymentChallenge.paymentId !== 'null') {
        lsatHelper.startListening(state.paymentChallenge.paymentId)
      }
    },
    stopListening ({ commit }) {
      lsatHelper.stopListening()
    },
    storePreimage ({ state, commit }, response) {
      return new Promise((resolve, reject) => {
        const token = lsatHelper.storeToken(response.settledInvoice.preimage, state.paymentChallenge)
        resolve(token)
      })
    }
  }
})
