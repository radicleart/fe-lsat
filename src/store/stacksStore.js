import store from '@/store'
import { openSTXTransfer, openContractCall, authenticate, showBlockstackConnect } from '@blockstack/connect'
import {
  Person,
  UserSession,
  decodeToken,
  getPublicKeyFromPrivate
} from 'blockstack'
import { LSAT_CONSTANTS } from '@/lsat-constants'
import {
  StacksTestnet,
  makeSTXTokenTransfer,
  makeContractCall,
  callReadOnlyFunction,
  broadcastTransaction

} from '@blockstack/stacks-transactions'
import axios from 'axios'
import BigNum from 'bn.js'

const BLOCKSTACK_LOGIN = Number(process.env.VUE_APP_BLOCKSTACK_LOGIN)
let STX_PAYMENT_ADDRESS = process.env.VUE_APP_STACKS_PAYMENT_ADDRESS
let STX_CONTRACT_ADDRESS = process.env.VUE_APP_STACKS_CONTRACT_ADDRESS
let STX_CONTRACT_NAME = process.env.VUE_APP_STACKS_CONTRACT_NAME
const network = new StacksTestnet()
const MESH_API = process.env.VUE_APP_API_RISIDIO + '/mesh'
const MESH_API_RISIDIO = process.env.VUE_APP_API_RISIDIO_REMOTE + '/mesh'
const mac = JSON.parse(process.env.VUE_APP_WALLET_MAC || '')
const origin = window.location.origin
const precision = 1000000

/**
const getStacksAccount = function (appPrivateKey) {
  const privateKey = createStacksPrivateKey(appPrivateKey)
  const publicKey = getPublicKey(privateKey)
  const address = addressFromPublicKeys(
    AddressVersion.TestnetSingleSig,
    AddressHashMode.SerializeP2PKH,
    1,
    [publicKey]
  )
  return { privateKey, address }
}
**/
const setAddresses = function () {
  const config = store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
  if (config && config.addresses) {
    STX_PAYMENT_ADDRESS = config.addresses.stxPaymentAddress
    STX_CONTRACT_ADDRESS = config.addresses.stxContractAddress
    STX_CONTRACT_NAME = config.addresses.stxContractName
  }
}

function unwrapStrings (tuple) {
  var names = tuple.match(/0x\w+/g) || []
  const name = Buffer.from(names[0].substring(2), 'hex').toString()
  return name
}

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
const userSession = new UserSession()
const authFinished = function () {
  store.dispatch('stacksStore/fetchMyAccount')
}
const authOptions = {
  sendToSignIn: false,
  redirectTo: '/',
  manifestPath: '/manifest.json',
  finished: authFinished,
  // authOrigin: 'http://localhost:8080',
  // userSession: userSession,
  appDetails: {
    name: 'risidio',
    icon: origin + '/img/logo/risidio_black.svg'
  }
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
      var authResponseToken = account.authResponseToken
      var decodedToken = decodeToken(authResponseToken)
      var publicKey = decodedToken.payload.public_keys[0]
      publicKey = getPublicKeyFromPrivate(account.appPrivateKey)
      const loggedIn = true
      myProfile = {
        loggedIn: loggedIn,
        identityAddress: account.identityAddress,
        publicKey: publicKey,
        showAdmin: showAdmin,
        showSuperAdmin: uname === 'mijoco.id.blockstack',
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
    IdentityAddress: publicKey,
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token
  }
  return headers
}

const stacksStore = {
  namespaced: true,
  state: {
    myProfile: {
      username: null,
      loggedIn: false,
      showAdmin: false
    },
    provider: 'risidio',
    authHeaders: null,
    appName: 'Risidio Mesh',
    appLogo: '/img/logo/Risidio_logo_256x256.png',
    wallet: mac
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
    loggedIn (state, loggedIn) {
      state.myProfile = loggedIn
    },
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
    startLogout ({ state, commit }) {
      return new Promise(resolve => {
        if (userSession.isUserSignedIn()) {
          userSession.signUserOut(window.location.origin)
          commit('myProfile', getProfile())
          resolve()
        }
      })
    },

    fetchWalletInfo ({ state, commit }) {
      return new Promise((resolve, reject) => {
        const data = {
          path: '/v2/accounts/' + state.wallet.keyInfo.address,
          httpMethod: 'get',
          postData: null
        }
        axios.post(MESH_API_RISIDIO + '/v2/accounts', data).then(response => {
          state.wallet.nonce = response.data.nonce
          state.wallet.balance = getAmountStx(parseInt(response.data.balance, 16))
          resolve(state.wallet)
        }).catch((error) => {
          reject(error)
        })
      })
    },

    callContractRisidio ({ state }, data) {
      return new Promise((resolve, reject) => {
        setAddresses()
        const profile = getProfile()
        if (!data.senderKey) {
          data.senderKey = profile.senderKey
        }
        let nonce = new BigNum(state.wallet.nonce)
        if (data && data.action === 'inc-nonce') {
          nonce = new BigNum(state.wallet.nonce + 1)
        }
        // 5000 000 000 000 000
        const txOptions = {
          contractAddress: STX_CONTRACT_ADDRESS,
          contractName: STX_CONTRACT_NAME,
          functionName: data.functionName,
          functionArgs: (data.functionArgs) ? data.functionArgs : [],
          fee: new BigNum(1800),
          senderKey: state.wallet.keyInfo.privateKey,
          nonce: new BigNum(nonce),
          validateWithAbi: false,
          network
        }
        makeContractCall(txOptions).then((transaction) => {
          if (state.provider !== 'risidio') {
            broadcastTransaction(transaction, network).then((result) => {
              resolve(result)
            }).catch((error) => {
              reject(error)
            })
          } else {
            const txdata = new Uint8Array(transaction.serialize())
            const useApi = (state.provider === 'risidio') ? MESH_API_RISIDIO : MESH_API
            const headers = {
              'Content-Type': 'application/octet-stream'
            }
            axios.post(useApi + '/v2/broadcast', txdata, { headers: headers }).then(response => {
              const result = {
                txId: response.data,
                network: 15,
                tokenId: Math.floor(Math.random() * Math.floor(1000000000))
              }
              resolve(result)
            }).catch((error) => {
              if (error.response) {
                if (error.response.data.message.indexOf('NotEnoughFunds') > -1) {
                  reject(new Error('Not enough funds in the wallet to send this - try decreasing the amount?'))
                } else if (error.response.data.message.indexOf('ConflictingNonceInMempool') > -1) {
                  reject(new Error('Conflicting Nonce In Mempool!'))
                } else {
                  reject(new Error(error.response.data.message))
                }
              } else {
                reject(error.message)
              }
            })
          }
        })
      })
    },
    callContractRisidioReadOnly ({ state }, data) {
      return new Promise((resolve, reject) => {
        setAddresses()
        const txoptions = {
          path: '/v2/contracts/call-read/' + STX_CONTRACT_ADDRESS + '/' + STX_CONTRACT_NAME + '/' + data.functionName,
          httpMethod: 'POST',
          postData: {
            arguments: (data.functionArgs) ? data.functionArgs : [],
            sender: STX_PAYMENT_ADDRESS
          }
        }
        const useApi = (state.provider === 'risidio') ? MESH_API_RISIDIO : MESH_API
        axios.post(useApi + '/v2/accounts', txoptions).then(response => {
          if (!response.data.okay) {
            reject(new Error('not okay'))
          } else {
            data.senderKey = null
            if (data.functionName === 'get-mint-price') {
              const res = getAmountStx(parseInt(response.data.result, 16))
              // const res = unwrapStrings(response.data.result) // response.data.result.substring(0)
              data.result = res
            } else {
              const res = unwrapStrings(response.data.result) // response.data.result.substring(2)
              // data.result = Buffer.from(res, 'hex').toString()
              data.result = res
            }
            resolve(data)
          }
        }).catch((error) => {
          if (error.response) {
            if (error.response.data.message.indexOf('NotEnoughFunds')) {
              reject(new Error('Not enough funds in the wallet to send this - try decreasing the amount?'))
            } else {
              reject(error.response.data.message)
            }
          } else {
            reject(error.message)
          }
        })
      })
    },
    callContractBlockstackReadOnly ({ state }, data) {
      return new Promise((resolve, reject) => {
        callReadOnlyFunction({
          contractAddress: STX_CONTRACT_ADDRESS,
          contractName: STX_CONTRACT_NAME,
          functionName: data.functionName,
          functionArgs: (data.functionArgs) ? data.functionArgs : [],
          senderAddress: state.wallet.keyInfo.address
        }).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    callContractBlockstack ({ state }, data) {
      // see https://docs.blockstack.org/smart-contracts/signing-transactions
      // Blocked a frame with origin "https://loopbomb.risidio.com" from accessing a cross-origin frame.
      return new Promise((resolve, reject) => {
        const txoptions = {
          contractAddress: STX_CONTRACT_ADDRESS,
          contractName: STX_CONTRACT_NAME,
          functionName: data.functionName,
          functionArgs: (data.functionArgs) ? data.functionArgs : [],
          appDetails: {
            name: state.appName,
            icon: state.appLogo
          },
          finished: response => {
            const result = {
              txId: response.data,
              network: 15,
              tokenId: Math.floor(Math.random() * Math.floor(1000000000))
            }
            resolve(result)
          }
        }
        openContractCall(txoptions)
      })
    },
    makeTransferRisidio ({ state }, data) {
      return new Promise((resolve, reject) => {
        network.coreApiUrl = 'http://localhost:20443'
        const paymentChallenge = store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
        let amount = Math.round(paymentChallenge.xchange.amountStx * precision)
        amount = parseInt(amount, 16)
        amount = new BigNum(amount)

        // amount = amount.div(new BigNum(1000000))
        const senderKey = state.wallet.keyInfo.privateKey
        let recipient = STX_PAYMENT_ADDRESS
        const configuration = store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
        if (configuration.addresses && configuration.addresses.stxPaymentAddress) {
          recipient = configuration.addresses.stxPaymentAddress
        }

        let nonce = new BigNum(state.wallet.nonce)
        if (data && data.action === 'inc-nonce') {
          nonce = new BigNum(state.wallet.nonce + 1)
        }

        const txOptions = {
          recipient: recipient,
          amount: amount,
          senderKey: senderKey,
          network,
          memo: 'Sending payment for game credits.',
          nonce: nonce, // set a nonce manually if you don't want builder to fetch from a Stacks node
          fee: new BigNum(2000) // set a tx fee if you don't want the builder to estimate
        }
        makeSTXTokenTransfer(txOptions).then((transaction) => {
          const txdata = new Uint8Array(transaction.serialize())
          const headers = {
            'Content-Type': 'application/octet-stream'
          }
          const useApi = (state.provider === 'risidio') ? MESH_API_RISIDIO : MESH_API
          axios.post(useApi + '/v2/broadcast', txdata, { headers: headers }).then(response => {
            resolve(response.data)
          }).catch((error) => {
            if (error.response) {
              if (error.response.data.message.indexOf('BadNonce') > -1) {
                reject(new Error('BadNonce! ' + error.response.data.message.substring(100)))
              } else if (error.response.data.message.indexOf('NotEnoughFunds') > -1) {
                reject(new Error('Not enough funds in the wallet to send this - try decreasing the amount?'))
              } else if (error.response.data.message.indexOf('ConflictingNonceInMempool') > -1) {
                reject(new Error('Error: ConflictingNonceInMempool'))
              } else {
                reject(error.response.data.message)
              }
            } else {
              reject(error.message)
            }
          })
        })
      })
    },
    makeTransferBlockstack ({ state }) {
      return new Promise((resolve, reject) => {
        const paymentChallenge = store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
        const configuration = store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
        let recipient = STX_PAYMENT_ADDRESS
        if (configuration.addresses && configuration.addresses.stxPaymentAddress) {
          recipient = configuration.addresses.stxPaymentAddress
        }
        // network.coreApiUrl = 'http://localhost:20443'
        openSTXTransfer({
          recipient: recipient,
          amount: paymentChallenge.xchange.amountStx,
          memo: 'Payment for ' + configuration.creditAttributes.start + ' credits',
          appDetails: {
            name: state.appName,
            icon: state.appLogo
          },
          finished: result => {
            resolve({ result: result })
          }
        }).catch((err) => {
          console.log(err)
          reject(err)
        })
      })
    }
  }
}
export default stacksStore
