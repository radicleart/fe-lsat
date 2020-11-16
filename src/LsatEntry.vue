<template v-if="loaded">
<span v-if="page === 'login'">
    <a v-if="!loggedIn" :style="loginStyles" href="#" @click.prevent="connectLogin">Login</a>
    <a v-else @click="connectLogout()" :style="loginStyles" href="#"><i class="fas fa-sign-out-alt"></i> Logout</a>
</span>
<div v-else>
  <div v-if="page === 'invoice'" :key="componentKey">
    <framework @paymentEvent="paymentEvent($event)"/>
  </div>
  <div class="" v-else-if="page === 'result'" >
    <result-page :lookAndFeel="lookAndFeel" :result="result" />
  </div>
  <div class="" v-else-if="page === 'administer-contract'" >
    <administer-contract @doContinue="doContinue"/>
  </div>
  <div class="" v-else >
    <p v-html="message"></p>
  </div>
  <div class="" v-if="showLsat" >
    <p v-html="paymentChallenge"></p>
  </div>
</div>
</template>

<script>
import Vue from 'vue'
import store from './store'
import Notifications from 'vue-notification'
import BootstrapVue from 'bootstrap-vue'
import Framework from './views/Framework'
import AdministerContract from './views/components/sessions/AdministerContract'
import ResultPage from './views/ResultPage'
import { LSAT_CONSTANTS } from './lsat-constants'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faQrcode, faPlus, faMinus, faEquals, faCopy, faAngleDoubleUp, faAngleDoubleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  bufferCV
} from '@stacks/transactions'
// import CryptoJS from 'crypto-js'

library.add(faQrcode)
library.add(faMinus)
library.add(faPlus)
library.add(faEquals)
library.add(faCopy)
library.add(faAngleDoubleUp)
library.add(faAngleDoubleDown)

Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.use(BootstrapVue)
Vue.config.productionTip = false
Vue.use(Notifications, { closeOnClick: true, duration: 6000 })
Vue.mixin({ store })

export default {
  name: 'LsatEntry',
  components: {
    Framework,
    ResultPage,
    AdministerContract
  },
  props: ['paymentConfig'],
  data () {
    return {
      page: 'waiting',
      result: null,
      lookAndFeel: null,
      loaded: false,
      showLsat: false,
      componentKey: 0,
      message: ''
    }
  },
  watch: {
    myProfile: function (profile, oldProfile) {
      this.$emit('paymentEvent', { returnCode: 'connect-login-session', profile: profile })
    },
    paymentChallenge: function (paymentChallenge, oldInvoice) {
      console.log(`We have ${paymentChallenge} fruits now, yay!`)
      if (!paymentChallenge) {
        return
      }
      if (oldInvoice && paymentChallenge.paymentId === oldInvoice.paymentId && paymentChallenge.status === oldInvoice.status) {
        this.componentKey++
        return
      }
      if (paymentChallenge.status > 3) {
        const data = { opcode: 'chain-payment-confirmed', status: paymentChallenge.status }
        const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
        this.$emit('paymentEvent', paymentEvent)
        console.log('paymentEvent', paymentEvent)
        this.waitingMessage = 'Thanks for paying - we sure hope you enjoy loopbomb!'
        this.result = data
        this.page = 'result'
      } else if (paymentChallenge.status === 3) {
        const data = { opcode: 'lsat-payment-begun', status: paymentChallenge.status }
        const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
        this.$emit('paymentEvent', paymentEvent)
        console.log('paymentEvent', paymentEvent)
      }
    }
  },
  mounted () {
    const paymentConfig = this.parseConfiguration()
    this.lookAndFeel = paymentConfig.lookAndFeel
    if (paymentConfig.opcode === 'mint-token') {
      this.mintToken(paymentConfig)
    } else if (paymentConfig.opcode === 'connect-deploy-contract') {
      this.deployContract(paymentConfig)
    } else if (paymentConfig.opcode === 'connect-login') {
      this.connectLogin()
    } else if (paymentConfig.opcode === 'connect-logout') {
      this.connectLogout()
    } else if (paymentConfig.opcode === 'connect-session') {
      this.connectSession()
    } else if (paymentConfig.opcode === 'connect-application') {
      this.connectApplication(paymentConfig.data)
    } else if (paymentConfig.opcode === 'mint-price') {
      this.getEthContractData()
    } else if (paymentConfig.opcode === 'administer-contract') {
      this.page = 'administer-contract'
      this.$store.dispatch('initialiseApp', paymentConfig).then((result) => {
        this.page = 'administer-contract'
        this.loaded = true
      })
    } else if (paymentConfig.opcode === 'load-credits') {
      this.$store.dispatch('initialiseApp', paymentConfig).then((result) => {
        this.page = 'invoice'
        this.loaded = true
      })
    }
  },
  beforeDestroy () {
  },
  methods: {
    connectLogin: function () {
      const myProfile = this.$store.getters['authStore/getMyProfile']
      if (myProfile.loggedIn) {
        this.$emit('connect-login', myProfile)
      } else {
        this.$store.dispatch('authStore/startLogin')
      }
    },
    /**
    connectApplication (data) {
      const bufArr = []
      for (let i = 0; i < data.functionArgs.length; i++) {
        const element = data.functionArgs[i]
        if (element.startsWith('0x')) {
          bufArr.push(intCV(element))
        } else {
          bufArr.push(bufferCV(Buffer.from(element)))
        }
      }
      data.functionArgs = bufArr
      if (data.provider === 'risidio') {
        this.$store.dispatch('wcStacksStore/callContractRisidio', data).then((result) => {
          this.$emit('paymentEvent', { returnCode: 'connect-application-success', result: result })
          console.log(result)
        }).catch((error) => {
          this.$emit('paymentEvent', { returnCode: 'connect-application-failure', error: error })
        })
      } else {
        this.$store.dispatch('wcStacksStore/callContractBlockstack', data).then((result) => {
          this.$emit('paymentEvent', { returnCode: 'connect-application-success', result: result })
          console.log(result)
        }).catch((error) => {
          this.$emit('paymentEvent', { returnCode: 'connect-application-failure', error: error })
        })
      }
    },
    **/
    connectSession () {
      this.$store.dispatch('authStore/fetchMyAccount').then((profile) => {
        this.$emit('paymentEvent', { returnCode: 'connect-login-session', profile: profile })
        console.log(profile)
      })
    },
    connectLogout () {
      this.$store.dispatch('authStore/startLogout').then((profile) => {
        localStorage.clear()
        sessionStorage.clear()
        this.$emit('paymentEvent', { returnCode: 'connect-logout-success', profile: profile })
      })
    },
    getEthContractData: function () {
      const config = { opcode: 'eth-get-contract-data' }
      this.$store.dispatch('ethereumStore/transact', config).then((result) => {
        this.loading = false
        const paymentEvent = {
          opcode: config.opcode,
          contractData: result
        }
        this.$emit('paymentEvent', paymentEvent)
        console.log('paymentEvent', paymentEvent)
      }).catch((e) => {
        this.$emit('paymentEvent', { opcode: 'eth-error-contract-data' })
        console.log('paymentEvent', { opcode: 'eth-error-contract-data' })
      })
    },
    mintToken: function (configuration) {
      if (configuration.paymentOption === 'stacks') {
        this.$store.dispatch('wcStacksStore/fetchMacsWalletInfo').then(() => {
          this.mintTokenStacks(configuration)
        })
      } else {
        this.mintTokenEthereum(configuration)
      }
    },
    mintTokenEthereum: function (configuration) {
      const mintConfig = { opcode: 'mint-token', assetHash: configuration.assetHash }
      this.message = 'Minting non fungible token - takes a minute or so..'
      this.$store.dispatch('ethereumStore/transact', { opcode: 'eth-get-total-supply' }).then((result) => {
        this.loading = false
        const data = {
          opcode: 'eth-get-total-supply',
          totalSupply: result.totalSupply
        }
        this.$emit('mintEvent', data)
        this.$store.dispatch('ethereumStore/transact', mintConfig).then((result) => {
          this.page = 'result'
          result.opcode = 'eth-mint-confirmed'
          this.$emit('mintEvent', result)
          this.result = result
        }).catch((e) => {
          this.message = (e.message) ? 'Error ' + e.message : 'Minting error - reason unknown'
          this.page = 'error'
          this.$emit('mintEvent', { opcode: 'eth-mint-error', message: e.message })
        })
      }).catch((e) => {
        this.$emit('paymentEvent', { opcode: 'eth-error-contract-data' })
        console.log('paymentEvent', { opcode: 'eth-error-contract-data' })
      })
    },
    mintTokenStacks: function (configuration) {
      this.message = 'Minting non fungible token - takes a minute or so..'
      const buffer = Buffer.from(configuration.assetHash, 'hex') // Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex')
      const data = {
        contractAddress: configuration.addresses.stxContractAddress,
        contractName: configuration.addresses.stxContractName,
        functionName: configuration.addresses.stxMintFunction,
        functionArgs: [bufferCV(buffer), bufferCV(Buffer.from(configuration.owner))]
      }
      let action = 'wcStacksStore/callContractBlockstack'
      if (configuration.provider && configuration.provider === 'risidio') {
        action = 'wcStacksStore/callContractRisidio'
      }
      this.$store.dispatch(action, data).then((result) => {
        this.page = 'result'
        if (!result) result = {}
        result.assetHash = configuration.assetHash
        result.opcode = 'stx-mint-confirmed'
        this.$store.dispatch('wcStacksStore/lookupNftTokenId', configuration).then((data) => {
          result.tokenId = data.value.value
          result.assetHash = configuration.assetHash
          this.$emit('mintEvent', result)
          this.result = result
        }).catch((e) => {
          // result.tokenId = -1
          this.$emit('mintEvent', result)
          this.result = result
        })
      }).catch((e) => {
        this.message = (e.message) ? 'Error ' + e.message : 'Minting error - reason unknown'
        this.page = 'error'
        this.$emit('mintEvent', { opcode: 'stx-mint-error', message: this.message })
      })
    },
    deployContract: function (configuration) {
      let action = 'wcStacksStore/deployContractBlockstack'
      if (configuration.provider && configuration.provider === 'risidio') {
        action = 'wcStacksStore/deployContractRisidio'
      }
      const profile = this.$store.getters['wcStacksStore/deployContract']
      configuration.data.profile = profile
      this.$store.dispatch(action, configuration.data).then((result) => {
        this.page = 'result'
        if (!result) result = {}
        result.returnCode = 'stx-deploy-confirmed'
        this.$emit('paymentEvent', result)
        this.result = result
      }).catch((e) => {
        this.message = (e.message) ? 'Error ' + e.message : 'Minting error - reason unknown'
        this.page = 'error'
        this.$emit('paymentEvent', { returnCode: 'stx-deploy-error', message: e.message })
      })
    },
    doContinue: function () {
      this.$emit('administerEvent', { opcode: 'administer-contract' })
    },
    parseConfiguration: function () {
      let paymentConfig = {}
      if (typeof this.paymentConfig === 'object') {
        paymentConfig = this.paymentConfig
      } else {
        try {
          paymentConfig = JSON.parse(this.paymentConfig)
        } catch {
          paymentConfig = JSON.parse(window.risidioPaymentConfig)
        }
      }
      if (paymentConfig.lookAndFeel) {
        this.lookAndFeel = paymentConfig.lookAndFeel
      }
      return paymentConfig
    },
    paymentEvent: function (data) {
      this.$emit('paymentEvent', data)
      console.log('paymentEvent', data)
    }
  },
  computed: {
    loginStyles () {
      return (this.lookAndFeel) ? this.lookAndFeel.loginStyles : ''
    },
    paymentChallenge () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return paymentChallenge
    },
    myProfile () {
      const myProfile = this.$store.getters[LSAT_CONSTANTS.KEY_PROFILE]
      return myProfile
    },
    loggedIn () {
      const myProfile = this.$store.getters[LSAT_CONSTANTS.KEY_PROFILE]
      return myProfile.loggedIn
    }
  }
}
</script>
<style lang="scss">
// @import "@/assets/scss/lsat-custom.scss";
</style>
