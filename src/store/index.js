import Vue from 'vue'
import Vuex from 'vuex'
import lsatHelper from './lsatHelper'
import ethereumStore from './ethereumStore'

Vue.use(Vuex)

const getAmountSat = function (amountBtc) {
  try {
    const precision = 100000000
    if (typeof amountBtc === 'string') {
      amountBtc = Number(amountBtc)
    }
    return Math.round(amountBtc * precision)
  } catch {
    return 0
  }
}
const setCurrentRate = function (state, value) {
  const rates = state.rates
  const ethToBtc = state.ethToBtc
  const amountBtc = value.amountFiat / rates[value.fiatCurrency]['15m']
  const precision = 100000000
  value.amountBtc = Math.round(amountBtc * precision) / 100000000
  value.amountSat = getAmountSat(amountBtc)
  value.amountEth = Math.round(amountBtc * ethToBtc.rate * precision) / 100000000
  return value
}

export default new Vuex.Store({
  modules: {
    ethereumStore: ethereumStore
  },
  state: {
    content: {
      homepage: null,
      navigation: null,
      products: null,
      pages: null
    },
    configuration: null,
    rates: null,
    ethToBtc: null,
    addSettledInvoice: null,
    keycloak: {
      name: 'auth-handler'
    },
    tempUserId: false,
    products: []
  },
  getters: {
    getConfiguration: state => {
      return state.configuration
    },
    getBitcoinAddress: state => {
      return localStorage.getItem('402-btca-' + state.configuration.productId)
    },
    getPurchaseOrder: state => {
      const purchaseOrder = JSON.parse(localStorage.getItem('402-' + state.configuration.productId))
      return purchaseOrder
    },
    getLsat: state => {
      const lsat = JSON.parse(localStorage.getItem('402-lsat-' + state.configuration.productId))
      return lsat
    },
    getLsatExpired: state => {
      return lsatHelper.lsatExpired(state.configuration.productId)
    },
    getLsatDuration: state => {
      return lsatHelper.lsatDuration(state.configuration.productId)
    },
    getValidLsat: state => {
      let lsat = JSON.parse(localStorage.getItem('402-lsat-' + state.configuration.productId))
      const expired = lsatHelper.lsatExpired(state.configuration.productId)
      if (expired) {
        localStorage.removeItem('402-lsat-' + state.configuration.productId)
        lsat = null
      }
      return lsat
    },
    getToken: state => productId => {
      const token = localStorage.getItem('402-token-' + productId)
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
    addSettledInvoice (state, o) {
      state.addSettledInvoice = o
    },
    addRates (state, o) {
      state.rates = o
    },
    addEthToBtc (state, o) {
      state.ethToBtc = o
    },
    addConfiguration (state, configuration) {
      state.configuration = configuration
    }
  },
  actions: {
    initialiseApp ({ state, commit }, configuration) {
      return new Promise((resolve, reject) => {
        lsatHelper.fetchRates('/lsat/v1/rates').then(() => {
          configuration.value = setCurrentRate(state, configuration.value)
          commit('addConfiguration', configuration)
          lsatHelper.checkPayment(configuration.productId).then((token) => {
            if (token) {
              // request the resource with the valid token
              lsatHelper.challenge(configuration).then((resource) => {
                resolve({ tokenAcquired: true, resource: resource })
              })
            } else {
              // if not perform the payment challenge...
              lsatHelper.challenge(configuration).then((resource) => {
                commit('addConfiguration', configuration)
                resolve({ tokenAcquired: false, resource: resource })
              })
            }
          })
        })
      })
    },
    fetchRates ({ state, commit }) {
      const pr = lsatHelper.fetchRates('/lsat/v1/rates')
      const config = state.configuration
      config.value = setCurrentRate(state, config.value)
      commit('addConfiguration', config)
      return pr
    },
    startListening ({ state, commit }) {
      const lsat = JSON.parse(localStorage.getItem('402-lsat-' + state.configuration.productId))
      lsatHelper.startListening(lsat.paymentHash)
    },
    stopListening ({ commit }) {
      lsatHelper.stopListening()
    },
    storePreimage ({ commit }, response) {
      return new Promise((resolve, reject) => {
        const token = lsatHelper.storeToken(response.settledInvoice.preimage, response.productId)
        resolve(token)
      })
    }
  }
})
