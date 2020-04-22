import Vue from 'vue'
import Vuex from 'vuex'
import contentStore from './contentStore'
import axios from 'axios'
import axiosHelper from './axiosHelper'
import lsatHelper from './lsatHelper'
import moment from 'moment'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    contentStore: contentStore
  },
  state: {
    keycloak: {
      name: 'auth-handler'
    },
    tempUserId: false,
    products: [],
    lsatProduct: null
  },
  getters: {
    getKeycloak: state => {
      return state.keycloak
    },
    getOrders: state => {
      return state.keycloak
    },
    getLsatProduct: state => productId => {
      const lsatProduct = JSON.parse(localStorage.getItem('402-' + productId))
      return lsatProduct
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
    addProduct (state, o) {
      state.products.push(o)
    },
    addLsat (state, o) {
      state.lsatProduct = o
    }
  },
  actions: {
    placeOrder ({ commit, state }, product) {
      return new Promise((resolve, reject) => {
        const lsatProduct = JSON.parse(localStorage.getItem('402-' + product.productId))
        if (lsatProduct && lsatProduct.lsat) {
          const now = moment().valueOf()
          const expired = now > lsatProduct.lsat.timeCreated + 3600000
          if (!expired) {
            resolve(lsatProduct)
            return
          }
        }
        // let request = axiosHelper.postParams('/buy-now', product)
        // request.headers['Authorization'] = 'LSAT ' + macaroon + ":" + preimage
        axios(axiosHelper.postParams('/assets/buy-now', product)).then(response => {
          // commit('addProduct', response.data)
          // resolve(response.data)
          reject(new Error({ error: 'Expected a 402 response - challenge to pay.' }))
        })
          .catch((error) => {
            if (error.response.status === 402) {
              const lsat = lsatHelper.storeLsat(error.response, lsatProduct.productId)
              product.lsat = lsat
              resolve(product)
            } else {
              console.log('Problem calling /buy-now ', error)
              reject(new Error({ error: error }))
            }
          })
      })
    },
    collectOrder ({ commit }) {
      return new Promise((resolve, reject) => {
        commit('addOrder', 'lsat')
        resolve('lsat')
      })
    },
    lookupInvoice ({ commit }, lsatProduct) {
      return new Promise((resolve, reject) => {
        axios(axiosHelper.postParams('/lsat/v1/invoice/' + lsatProduct.lsat.paymentHash)).then(response => {
          if (response && response.data) {
            const invoice = response.data
            if (invoice.settleDate > 0) {
              const token = lsatHelper.storeToken(invoice.preimage, lsatProduct.productId)
              commit('token', token)
              resolve(token)
            }
          }
        })
      })
    },
    storePreimage ({ commit }, response) {
      return new Promise((resolve, reject) => {
        const token = lsatHelper.storeToken(response.settledInvoice.preimage, response.productId)
        commit('token', token)
        resolve(token)
      })
    }
  }
})
