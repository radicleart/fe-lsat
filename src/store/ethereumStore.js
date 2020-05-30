import Web3 from 'web3'
import _ from 'lodash'

const NFT_CONTRACT_ADDRESS = process.env.VUE_APP_NFT_CONTRACT_ADDRESS
const NETWORK = process.env.VUE_APP_NETWORK
const OWNER_ADDRESS = process.env.VUE_APP_OWNER_ADDRESS

const NFT_ABI = [{
  constant: false,
  inputs: [
    {
      name: '_to',
      type: 'address'
    }
  ],
  name: 'mintTo',
  outputs: [],
  payable: false,
  stateMutability: 'nonpayable',
  type: 'function'
}]

const getWeb3 = function () {
  return new Promise((resolve, reject) => {
    const ethereum = window.ethereum
    let web3 = window.web3
    if (typeof ethereum !== 'undefined') {
      ethereum.enable().then((res) => {
        web3 = new Web3(ethereum)
        resolve(web3)
      })
    } else if (typeof web3 !== 'undefined') {
      web3 = new Web3(web3.currentProvider)
      resolve(web3)
    } else {
      web3 = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER))
      resolve(web3)
    }
  })
}
const resolveError = function (reject, error) {
  if (error && error.message && error.message.toLowerCase().indexOf('user denied') > -1) {
    reject(new Error('Minting process cancelled...'))
  } else {
    reject(new Error('Unable to contact your <b>Meta Mask wallet</b> <br/> are you logged in and connected to the ' + NETWORK + ' network?'))
  }
}

const sendPayment = function (web3, data, account, resolve, reject) {
  const amountToSend = web3.utils.toWei(String(data.amount), 'ether') // convert to wei value
  web3.eth.sendTransaction({ from: account, to: OWNER_ADDRESS, value: amountToSend }).then((res) => {
    const result = {
      txId: res.transactionHash
    }
    resolve(result)
  }).catch((e) => {
    resolveError(reject, e)
  })
}

const mintToken = function (web3, data, account, resolve, reject) {
  const nftContract = new web3.eth.Contract(NFT_ABI, NFT_CONTRACT_ADDRESS, { gasLimit: '1000000' })
  nftContract.methods.mintTo(account).send({ from: OWNER_ADDRESS }).then((res) => {
    const result = {
      assetHash: data.assetHash,
      txId: res.transactionHash
    }
    if (res.events && _.size(res.events) > 0) {
      for (var key in res.events) {
        const event = res.events[key]
        if (event) {
          result.tokenId = parseInt(event.raw.topics[3], 16)
          result.logIndex = event.logIndex
        }
      }
    }
    resolve(result)
  }).catch((e) => {
    resolveError(reject, e)
  })
}

const ethereumStore = {
  namespaced: true,
  state: {
  },
  getters: {
  },
  mutations: {
  },
  actions: {
    transact ({ commit, state }, data) {
      return new Promise((resolve, reject) => {
        getWeb3().then((web3) => {
          if (!web3) {
            reject(new Error('no ethereum provider registered - please download Meta Mask to continue!'))
          }
          web3.eth.getAccounts(function (error, accounts) {
            if (error) {
              reject(new Error('Please check you are logged in to meta mask - then try again?'))
            } else if (!accounts || accounts.length === 0) {
              reject(new Error('No accounts - not logged in to wallet'))
            } else {
              if (data.opcode === 'send-payment') {
                sendPayment(web3, data, accounts[0], resolve, reject)
              } else if (data.opcode === 'mint-token') {
                mintToken(web3, data, accounts[0], resolve, reject)
              }
            }
          })
        })
      })
    },
    enable ({ commit, state }, data) {
      return new Promise((resolve, reject) => {
        getWeb3().then((web3) => {
          resolve(true)
        })
      })
    }
  }
}
export default ethereumStore
