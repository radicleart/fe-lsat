<template v-if="loaded">
<span v-if="page === 'login'">
    <a v-if="!loggedIn" :style="loginStyles" href="#" @click.prevent="loginBanter">Login</a>
    <a v-else @click="logout()" :style="loginStyles" href="#"><i class="fas fa-sign-out-alt"></i> Logout</a>
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
} from '@blockstack/stacks-transactions'
import CryptoJS from 'crypto-js'

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
      message: 'Loading invoice data - please wait...'
    }
  },
  watch: {
    paymentChallenge (paymentChallenge, oldInvoice) {
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
    this.$store.dispatch('stacksStore/fetchWalletInfo').then((wallet) => {
      console.log(wallet)
    })
    const paymentConfig = this.parseConfiguration()
    this.lookAndFeel = paymentConfig.lookAndFeel
    if (paymentConfig.opcode === 'mint-token') {
      this.mintToken(paymentConfig)
    } else if (paymentConfig.opcode === 'login') {
      this.page = 'login'
      this.loaded = true
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
    loginBanter: function () {
      this.$store.dispatch('stacksStore/startLogin')
      this.$emit('login')
      const $self = this
      let counter = 0
      const intval = setInterval(function () {
        const myProfile = $self.$store.getters['stacksStore/getMyProfile']
        if (myProfile.loggedIn) {
          clearInterval(intval)
        }
        if (counter === 200) {
          clearInterval(intval)
        }
        counter++
      }, 1000)
    },
    logout () {
      this.$store.dispatch('stacksStore/startLogout').then(() => {
        localStorage.clear()
        sessionStorage.clear()
        this.$emit('logout')
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
        this.$store.dispatch('stacksStore/fetchWalletInfo').then((wallet) => {
          this.mintTokenStacks(configuration, wallet)
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
          this.message = e.message
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
      // const assetHash = crypto.createHash('sha256').update(this.message).digest('hex')
      const hash = CryptoJS.SHA256(configuration.assetHash)
      const buffer = Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex')
      const assetHash = bufferCV(buffer)
      const data = {
        functionName: 'create-loopbomb',
        functionArgs: [assetHash]
      }
      let action = 'stacksStore/callContractBlockstack'
      if (configuration.provider && configuration.provider === 'risidio') {
        action = 'stacksStore/callContractRisidio'
      }
      this.$store.dispatch(action, data).then((result) => {
        this.page = 'result'
        result.opcode = 'stx-mint-confirmed'
        this.$emit('mintEvent', result)
        this.result = result
      }).catch((e) => {
        this.message = e.message
        this.page = 'error'
        this.$emit('mintEvent', { opcode: 'stx-mint-error', message: e.message })
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
    loggedIn () {
      const myProfile = this.$store.getters['stacksStore/getMyProfile']
      return myProfile.loggedIn
    }
  }
}
</script>
<style lang="scss">
// @import "@/assets/scss/lsat-custom.scss";
</style>
