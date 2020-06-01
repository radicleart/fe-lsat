<template>
<div>
  <framework :key="componentKey" v-if="loaded && page === 'invoice'" @paymentEvent="paymentEvent($event)"/>
  <div class="d-flex justify-content-center" v-else-if="page === 'result'" >
    <result-page :result="result" />
  </div>
  <div class="d-flex justify-content-center" v-else-if="page === 'token'" >
    <token :token="token" @startOver="startOver"/>
  </div>
  <div class="d-flex justify-content-center" v-else >
    <p v-html="message"></p>
  </div>
  <div class="d-flex justify-content-center" v-if="showLsat" >
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
import ResultPage from './views/ResultPage'
// import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
// import '../node_modules/bootstrap-vue/dist/bootstrap-vue.css'
import { LSAT_CONSTANTS } from './lsat-constants'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faEquals, faCopy, faAngleDoubleUp, faAngleDoubleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

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
    ResultPage
  },
  props: ['paymentConfig'],
  data () {
    return {
      page: 'waiting',
      result: null,
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
        this.waitingMessage = 'Thanks for paying - we sure hope you enjoy loopbomb!'
        this.result = data
        this.page = 'result'
      } else if (paymentChallenge.status === 3) {
        const data = { opcode: 'lsat-payment-begun', status: paymentChallenge.status }
        const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
        this.$emit('paymentEvent', paymentEvent)
      }
    }
  },
  mounted () {
    const paymentConfig = this.parseConfiguration()
    if (paymentConfig.opcode === 'mint-token') {
      this.mintToken(paymentConfig)
    } else {
      if (paymentConfig.paymentId && this.paymentSent(paymentConfig)) {
        const data = { opcode: 'lsat-payment-confirmed' }
        const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
        this.$emit('paymentEvent', paymentEvent)
      } else {
        this.initialiseApp(paymentConfig)
      }
    }
  },
  beforeDestroy () {
    this.$store.dispatch('stopListening')
  },
  methods: {
    mintToken: function (configuration) {
      // NB the config contains a paymentId which can be null for free sessions - status = 9 !
      const mintConfig = { opcode: 'mint-token', assetHash: configuration.assetHash }
      this.message = 'Minting non fungible token - takes a minute or so..'
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
      return paymentConfig
    },
    paymentSent: function (configuration) {
      const token = this.$store.getters[LSAT_CONSTANTS.KEY_TOKEN]
      if (token) {
        this.page = 'token'
        const data = { opcode: 'lsat-payment-confirmed' }
        const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
        this.$emit('paymentEvent', paymentEvent)
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
        } else {
          this.$store.dispatch('startListening')
          this.page = 'invoice'
          this.loaded = true
        }
      })
    },
    paymentEvent: function (data) {
      if (data.opcode === 'payment-expired') {
        this.paymentExpired()
      } else if (data.opcode === 'lsat-payment-credits') {
        this.page = 'invoice'
        this.componentKey += 1
      } else {
        this.page = 'invoice'
        this.result = data
      }
      this.$emit('paymentEvent', data)
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
    paymentChallenge () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return paymentChallenge
    },
    token () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return (paymentChallenge && paymentChallenge.lsatInvoice) ? paymentChallenge.lsatInvoice.token : {}
    }
  }
}
</script>
<style lang="scss">
@import "@/assets/scss/lsat-custom.scss";
</style>
