import Vue from 'vue'
import Vuex from 'vuex'
import lsatHelper from './lsatHelper'
import ethereumStore from './ethereumStore'
import authStore from './authStore'
import wcStacksStore from '@/store/wcStacksStore'
import {
  UserSession,
  decodeToken
} from 'blockstack'

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
const options = [{ text: 'Ether', value: 'ethereum' }, { text: 'Stacks', value: 'stacks' }]
const getPaymentOptions = function (paymentChallenge, configuration) {
  const allowedOptions = []
  options.forEach(function (option) {
    if (option.value === 'ethereum') {
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
    xchange: {
      numbCredits: creditAttributes.start,
      fiatCurrency: creditAttributes.fiatCurrency,
      amountFiat: amountFiat,
      amountBtc: amountBtc,
      amountSat: getAmountSat(amountBtc),
      amountEth: Math.round((amountBtc / rateObject.ethToBtcRate.rate) * precision) / precision,
      amountStx: Math.round((amountBtc / rateObject.stxToBtcRate.rate) * precision) / precision
    }
  }
  return pc
}

export default new Vuex.Store({
  modules: {
    ethereumStore: ethereumStore,
    wcStacksStore: wcStacksStore,
    authStore: authStore
  },
  state: {
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
        status: (data.status) ? data.status : state.paymentChallenge.status,
        result: data.result,
        numbCredits: state.paymentChallenge.xchange.numbCredits
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
          xchange: state.configuration.value
        }
      }
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
    initialiseApp ({ state, dispatch, commit }, configuration) {
      const $self = this
      return new Promise((resolve, reject) => {
        commit('addHeaders', authHeaders(configuration))
        commit('addPaymentConfig', configuration)
        $self.dispatch('wcStacksStore/fetchMacsWalletInfo').then(() => {
          dispatch('fetchRates').then(() => {
            commit('addPaymentChallenge', initPaymentChallenge(state.rateObject, state.configuration.creditAttributes))
            resolve({ tokenAcquired: false, resource: state.paymentChallenge })
          })
        })
      })
    },
    receivePayment ({ state, commit }, paymentEvent) {
      return new Promise((resolve, reject) => {
        const pc = state.paymentChallenge
        pc.status = paymentEvent.status
        pc.etherTxId = paymentEvent.txId
        commit('addPaymentChallenge', pc)
        resolve(pc)
      })
    },
    updateAmount ({ state, commit }, data) {
      state.configuration.creditAttributes.start = data.numbCredits
      const paymentChallenge = initPaymentChallenge(state.rateObject, state.configuration.creditAttributes)
      commit('addPaymentChallenge', paymentChallenge)
    },
    fetchRates ({ commit }) {
      return new Promise((resolve, reject) => {
        lsatHelper.fetchRates().then((rateObject) => {
          commit('addRateObject', rateObject)
          resolve(rateObject)
        })
      })
    }
  }
})
