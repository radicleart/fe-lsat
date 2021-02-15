import store from '@/store'
import { AppConfig, UserSession, showConnect, authenticate } from '@stacks/connect'

const BLOCKSTACK_LOGIN = Number(process.env.VUE_APP_BLOCKSTACK_LOGIN)
const NETWORK = process.env.VUE_APP_NETWORK

const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })
const origin = window.location.origin
const authFinished = function () {
  store.dispatch('initApplication').then(() => {
    // router.push('/')
  })
}
const authOptions = {
  sendToSignIn: true,
  redirectTo: '/',
  manifestPath: '/manifest.json',
  finished: authFinished,
  // authOrigin: 'http://localhost:8080',
  // userSession: userSession,
  appDetails: {
    name: 'loopbomb',
    icon: origin + '/img/logo/android_chrome_256x256.png'
  },
  userSession: userSession
}
const getProfile = function () {
  let myProfile = {
    loggedIn: false
  }
  try {
    const account = userSession.loadUserData()
    if (account) {
      let uname = account.username
      let name = account.profile.name
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
      const loggedIn = true
      myProfile = {
        loggedIn: loggedIn,
        stxAddress: (NETWORK === 'mainnet') ? account.profile.stxAddress.mainnet : account.profile.stxAddress.testnet,
        identityAddress: account.identityAddress,
        showAdmin: showAdmin,
        showSuperAdmin: uname === 'radicle_art.id.blockstack',
        senderKey: account.privateKey,
        name: name,
        description: account.profile.description,
        avatarUrl: account.profile.avatarUrl,
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
  var publicKey
  let token = 'v1:no-token' // note: not all requests require auth token - e.g. getPaymentAddress
  if (userSession.isUserSignedIn()) {
    const account = userSession.loadUserData()
    if (account) {
      // decodedToken = decodeToken(authResponseToken)
      // publicKey = decodedToken.payload.public_keys[0]
      publicKey = account.identityAddress
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

const lsatAuthStore = {
  namespaced: true,
  state: {
    myProfile: {
      username: null,
      loggedIn: false,
      showAdmin: false
    },
    authHeaders: null
  },
  getters: {
    getMyProfile: state => {
      return state.myProfile
    },
    getAuthHeaders: state => {
      return state.authHeaders
    }
  },
  mutations: {
    myProfile (state, myProfile) {
      state.myProfile = myProfile
    },
    authHeaders (state, authHeaders) {
      state.authHeaders = authHeaders
    }
  },
  actions: {
    fetchMyAccount ({ state, commit }) {
      return new Promise(resolve => {
        if (userSession.isUserSignedIn()) {
          // userSession.signUserOut(window.location.origin)
          const profile = getProfile()
          commit('myProfile', profile)
          commit('authHeaders', authHeaders())
          resolve(profile)
        } else if (userSession.isSignInPending()) {
          userSession.handlePendingSignIn().then(() => {
            const profile = getProfile()
            commit('myProfile', profile)
            commit('authHeaders', authHeaders())
            resolve(profile)
          })
        } else {
          const profile = getProfile()
          commit('myProfile', profile)
          commit('authHeaders', authHeaders())
          resolve(profile)
        }
      })
    },
    startLogin ({ state, commit }) {
      return new Promise(resolve => {
        if (BLOCKSTACK_LOGIN === 1) {
          showConnect(authOptions)
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
    startLogout ({ state, commit }) {
      return new Promise(resolve => {
        if (userSession.isUserSignedIn()) {
          userSession.signUserOut(window.location.origin)
          commit('myProfile', getProfile())
        }
      })
    }
  }
}
export default lsatAuthStore
