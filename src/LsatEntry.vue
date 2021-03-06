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
  <div class="" v-else-if="page === 'token'" >
    <token :token="token" @startOver="startOver"/>
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
import Token from './views/components/Token'
import Framework from './views/Framework'
import AdministerContract from './views/AdministerContract'
import ResultPage from './views/ResultPage'
import { LSAT_CONSTANTS } from './lsat-constants'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faQrcode, faPlus, faMinus, faEquals, faCopy, faAngleDoubleUp, faAngleDoubleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

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
    Token,
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
        const data = { opcode: 'lsat-payment-confirmed', status: paymentChallenge.status }
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
      } else {
        const data = {
          opcode: 'lsat-status-change',
          status: paymentChallenge.status,
          orderCode: paymentChallenge.paymentId,
          token: (paymentChallenge.lsatInvoice) ? paymentChallenge.lsatInvoice.token : null
        }
        this.$emit('paymentEvent', data)
        console.log('paymentEvent', data)
      }
    }
  },
  mounted () {
    const paymentConfig = this.parseConfiguration()
    this.lookAndFeel = paymentConfig.lookAndFeel
    if (paymentConfig.ratesWatch) {
      this.ratesWatch(paymentConfig)
    }
    if (paymentConfig.opcode === 'mint-token') {
      this.mintToken(paymentConfig)
    } else if (paymentConfig.opcode === 'login') {
      this.page = 'login'
      this.loaded = true
    } else if (paymentConfig.opcode === 'mint-price') {
      this.getEthContractData()
    } else if (paymentConfig.opcode === 'administer-contract') {
      this.page = 'administer-contract'
    } else {
      // check local storage for a valid token and notify caller if exists.
      if (paymentConfig.paymentId && this.paymentSent(paymentConfig)) {
        const data = { opcode: 'lsat-payment-confirmed' }
        const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
        this.$emit('paymentEvent', paymentEvent)
        console.log('paymentEvent', paymentEvent)
      } else {
        this.initialiseApp(paymentConfig)
      }
    }
  },
  beforeDestroy () {
    this.$store.dispatch('stopListening')
  },
  methods: {
    loginBanter: function () {
      this.$store.dispatch('authStore/startLogin')
      this.$emit('login')
      const $self = this
      let counter = 0
      const intval = setInterval(function () {
        const myProfile = $self.$store.getters['authStore/getMyProfile']
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
      this.$store.dispatch('authStore/startLogout').then(() => {
        localStorage.clear()
        sessionStorage.clear()
        this.$emit('logout')
      })
    },
    ratesWatch: function () {
      const $self = this
      $self.fetchRates()
      setInterval(function () {
        $self.fetchRates()
      }, 30000)
    },
    fetchRates: function () {
      this.$store.dispatch('fetchRates').then((rates) => {
        this.$emit('ratesEvent', { opcode: 'rates-result', rates: rates })
      }).catch((e) => {
        console.log('ratesEvent', { opcode: 'rates-error' })
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
    paymentSent: function (configuration) {
      const token = this.$store.getters[LSAT_CONSTANTS.KEY_TOKEN]
      if (token) {
        this.page = 'token'
        const data = { opcode: 'lsat-payment-confirmed', token: token }
        const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
        this.$emit('paymentEvent', paymentEvent)
        console.log('paymentEvent', paymentEvent)
        return true
      }
    },
    initialiseApp: function (paymentConfig) {
      const methodName = (paymentConfig.paymentId) ? 'initialiseApp' : 'reinitialiseApp'
      this.$store.dispatch(methodName, paymentConfig).then((result) => {
        if (result.tokenAcquired) {
          this.message = 'resource has been acquired. <br/><br/>'
          this.page = 'token'
          const data = { opcode: 'lsat-payment-confirmed' }
          const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
          this.$emit('paymentEvent', paymentEvent)
          console.log('paymentEvent', data)
        } else {
          this.$store.dispatch('startListening')
          this.page = 'invoice'
          this.loaded = true
          this.$emit('paymentEvent', { opcode: 'lsat-payment-loaded' })
          console.log('paymentEvent', { opcode: 'lsat-payment-loaded' })
        }
      })
    },
    paymentEvent: function (data) {
      if (data.opcode === 'lsat-payment-expired') {
        this.paymentExpired()
      } else if (data.opcode === 'lsat-payment-credits') {
        this.page = 'invoice'
        this.componentKey += 1
      } else {
        this.page = 'invoice'
        this.result = data
      }
      this.$emit('paymentEvent', data)
      console.log('paymentEvent', data)
    },
    paymentExpired () {
      this.$store.dispatch('fetchRates')
    },
    startOver () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.$store.dispatch('reinitialiseApp', configuration).then((resource) => {
        this.page = 'invoice'
      })
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
      const myProfile = this.$store.getters['authStore/getMyProfile']
      return myProfile.loggedIn
    },
    token () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return (paymentChallenge && paymentChallenge.lsatInvoice) ? paymentChallenge.lsatInvoice.token : {}
    }
  }
}
</script>
<style lang="scss">
// @import "@/assets/scss/lsat-custom.scss";
</style>
