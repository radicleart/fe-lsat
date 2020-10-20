/* eslint-disable */
import {
  Person,
  decodeToken,
  UserSession
} from 'blockstack'
import { showBlockstackConnect, authenticate } from '@blockstack/connect'
import store from '@/store'
import {
  getAddressFromPrivateKey,
  createStacksPrivateKey,
} from '@blockstack/stacks-transactions'
import axios from 'axios'

const BLOCKSTACK_LOGIN = Number(process.env.VUE_APP_BLOCKSTACK_LOGIN)
const MESH_API = process.env.VUE_APP_API_RISIDIO_REMOTE + '/mesh'
const userSession = new UserSession()
const origin = window.location.origin
const getStacksAccount = function (appPrivateKey) {
  const privateKey = createStacksPrivateKey(appPrivateKey)
  return getAddressFromPrivateKey(privateKey.data.toString('hex'))
}
const precision = 1000000
const getAmountStx = function (amountMicroStx) {
  try {
    if (typeof amountMicroStx === 'string') {
      amountMicroStx = Number(amountMicroStx)
    }
    if (amountMicroStx === 0) return 0
    amountMicroStx = amountMicroStx / precision
    return Math.round(amountMicroStx * precision) / precision
  } catch {
    return 0
  }
}
const authFinished = function(o) {
  store.commit('authStore/setAuthResponse', o)
  store.dispatch('authStore/fetchMyAccount')
}
const authOptions = {
  sendToSignIn: false,
  redirectTo: '/',
  manifestPath: '/manifest.json',
  finished: authFinished,
  appDetails: {
    name: 'Risidio Meshnet',
    icon: origin + '/img/logo/risidio_black.svg'
  }
}
const fetchUserWallet = function (profile) {
  return new Promise((resolve, reject) => {
    const data = {
      path: '/v2/accounts/' + profile.stxAddress,
      httpMethod: 'get',
      postData: null
    }
    axios.post(MESH_API + '/v2/accounts', data).then(response => {
      const balance = getAmountStx(parseInt(response.data.balance, 16))
      const wallet = {
        keyInfo: {
          address: profile.stxAddress
        },
        balance: balance,
        nonce: response.data.nonce,
        label: profile.username
      }
      resolve(wallet)
    }).catch((error) => {
      console.log(error)
      reject()
    })
  })
}
const getProfile = function () {
  let myProfile = {
    loggedIn: false
  }
  try {
    const account = userSession.loadUserData()
    if (account) {
      let uname = account.username
      const person = new Person(account.profile)
      let name = person.name()
      if (uname) {
        if (!name) {
          const indexOfDot = uname.indexOf('.')
          name = uname.substring(0, indexOfDot)
        }
      }
      if (!uname && name) {
        uname = name
      }
      if (!uname) {
        uname = ''
      }
      const showAdmin =
        uname === 'mike.personal.id' ||
        uname.indexOf('brightblock') > -1 ||
        uname.indexOf('risidio') > -1 ||
        uname.indexOf('radicle') > -1 ||
        uname.indexOf('mijoco') > -1 ||
        uname.indexOf('head') > -1 ||
        uname.indexOf('testuser0934583') > -1 ||
        uname.indexOf('feek') > -1
      const avatarUrl = person.avatarUrl()
      // let privateKey = account.appPrivateKey + '01'
      // privateKey = hexStringToECPair(privateKey).toWIF()
      // const authResponseToken = account.authResponseToken
      // var decodedToken = decodeToken(authResponseToken)
      // const publicKey = getAddressFromPrivateKey(id.privateKey.data.toString('hex'))
    const stxAppAddress = getStacksAccount(account.appPrivateKey)
      const loggedIn = true
      myProfile = {
        loggedIn: loggedIn,
        stxAddress: account.profile.stxAddress,
        stxAppAddress: stxAppAddress,
        senderKey: account.privateKey,
        showAdmin: showAdmin,
        superAdmin: uname === 'mijoco.id.blockstack',
        name: name,
        description: person.description(),
        avatarUrl: avatarUrl,
        username: uname,
        hubUrl: account.hubUrl,
        apps: account.profile.apps
      }
    }
    return myProfile
  } catch (err) {
    return myProfile
  }
}

const authHeaders = function () {
  let publicKey
  let token = 'v1:no-token' // note: not all requests require auth token - e.g. getPaymentAddress
  if (userSession.isUserSignedIn()) {
    const account = userSession.loadUserData()
    if (account) {
      const authResponseToken = account.authResponseToken
      const decodedToken = decodeToken(authResponseToken)
      publicKey = decodedToken.payload.public_keys[0]
      token = 'v1:' + account.authResponseToken
    }
  }
  const headers = {
    IdentityAddress: publicKey,
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token
  }
  return headers
}

const authStore = {
  namespaced: true,
  state: {
    userWallet: null,
    authResponse: null,
    myProfile: {
      username: null,
      loggedIn: false,
      showAdmin: false
    },
    appName: 'Risidio Mesh',
    appLogo: '/img/logo/Risidio_logo_256x256.png',
    authHeaders: null,
    networkId: 'testnet'
  },
  getters: {
    getMyProfile: state => {
      if (!state.myProfile) {
        return {
          loggedIn: false
        }
      }
      return state.myProfile
    },
    getUserWallet: (state) => {
      return state.userWallet
    },
    getNetworkId: (state) => {
      return state.networkId
    },
    getAuthHeaders: (state) => {
      return state.authHeaders
    },
    getAuthResponse: (state) => {
      return state.authResponse
    }
  },
  mutations: {
    loggedIn (state, loggedIn) {
      state.myProfile.loggedIn = loggedIn
    },
    setAuthResponse (state, o) {
      state.authResponse = o
    },
    setNetworkId (state, networkId) {
      state.networkId = networkId
    },
    myProfile (state, myProfile) {
      state.myProfile = myProfile
    },
    userWallet (state, userWallet) {
      state.userWallet = userWallet
    },
    authHeaders (state, authHeaders) {
      state.authHeaders = authHeaders
    }
  },
  actions: {
    fetchMyAccount ({ commit }) {
      return new Promise(resolve => {
        if (userSession.isUserSignedIn()) {
          // userSession.signUserOut(window.location.origin)
          const profile = getProfile()
          fetchUserWallet(profile).then((wallet) => {
            profile.wallet = wallet
            commit('myProfile', profile)
            // store.commit('authStore/userWallet', wallet)
            commit('authHeaders', authHeaders())
            resolve(profile)
          }).catch((error) => {
            console.log(error)
            commit('myProfile', profile)
            resolve(profile)
          })
      } else if (userSession.isSignInPending()) {
          userSession.handlePendingSignIn().then(() => {
            const profile = getProfile()
            fetchUserWallet(profile).then((wallet) => {
              // store.commit('authStore/userWallet', wallet)
              profile.wallet = wallet
              commit('myProfile', profile)
              commit('authHeaders', authHeaders())
              resolve(profile)
            }).catch((error) => {
              console.log(error)
              commit('myProfile', profile)
              resolve(profile)
            })
          })
        } else {
          const profile = getProfile()
          commit('myProfile', profile)
          commit('authHeaders', authHeaders())
          resolve(profile)
        }
      })
    },
    startLogin({ }) {
      return new Promise(resolve => {
        if (BLOCKSTACK_LOGIN === 1) {
          showBlockstackConnect(authOptions)
        } else if (BLOCKSTACK_LOGIN === 2) {
          authenticate(authOptions)
        } else {
          const origin = window.location.origin
          const transitKey = userSession.generateAndStoreTransitKey()
          const scopes = [
            'store_write',
            'publish_data'
          ]
          const authRequest = userSession.makeAuthRequest(transitKey, origin, origin + '/manifest.json', scopes)
          userSession.redirectToSignInWithAuthRequest(authRequest, 'http://localhost:8888/auth')
          resolve()
        }
      })
    },
    startLogout ({ commit }) {
      return new Promise((resolve) => {
        if (userSession.isUserSignedIn()) {
          userSession.signUserOut(window.location.origin)
          commit('myProfile', getProfile())
        }
        resolve(getProfile())
      })
    }
  }
}
export default authStore
