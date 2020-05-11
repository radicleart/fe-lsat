<template>
<div>
  <framework v-if="page === 'invoice'" @paymentEvent="paymentEvent($event)"/>
  <div class="d-flex justify-content-center" v-else-if="page === 'result'" >
    <result-page :result="result" />
  </div>
  <div class="d-flex justify-content-center" v-else-if="page === 'token'" >
    <token :token="token" :product="configuration.product" />
  </div>
  <div class="d-flex justify-content-center" v-else >
    <p v-html="message"></p>
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
  props: ['config'],
  data () {
    return {
      page: 'waiting',
      result: null,
      message: 'Loading invoice data - please wait...'
    }
  },
  mounted () {
    this.$store.commit('addTempUserId')
    const configuration = this.parseConfiguration()
    if (configuration.opcode === 'mint-token') {
      this.mintToken(configuration)
    } else {
      if (this.paymentSent(configuration)) {
        this.$emit('paymentEvent', { opcode: 'lsat-payment-confirmed', productId: configuration.productId })
      } else {
        this.initialiseApp(configuration)
      }
    }
  },
  beforeDestroy () {
    this.$store.dispatch('stopListening')
  },
  methods: {
    mintToken: function (configuration) {
      const mintConfig = { opcode: 'mint-token', assetHash: configuration.productId }
      this.message = 'Minting non fungible token - takes a minute or so..'
      this.$store.dispatch('ethereumStore/transact', mintConfig).then((result) => {
        this.$emit('mintEvent', result)
        this.page = 'result'
        result.opcode = 'eth-mint-confirmed'
        this.result = result
      }).catch((e) => {
        this.message = e.message
        this.page = 'error'
        this.$emit('mintEvent', { opcode: 'eth-mint-error', message: e.message })
      })
    },
    parseConfiguration: function (configuration) {
      if (typeof this.config === 'object') {
        configuration = JSON.parse(this.config)
      } else {
        try {
          configuration = JSON.parse(this.config)
        } catch {
          configuration = JSON.parse(window.radicle_lsat_config)
        }
      }
      if (!configuration.productId) {
        configuration.productId = store.getters[LSAT_CONSTANTS.KEY_TEMP_USER_ID]
      }
      return configuration
    },
    paymentSent: function (configuration) {
      const token = this.$store.getters[LSAT_CONSTANTS.KEY_TOKEN](configuration.productId)
      if (token) {
        this.page = 'token'
        this.$emit('paymentEvent', { opcode: 'lsat-payment-confirmed', productId: configuration.productId })
        return true
      }
    },
    initialiseApp: function (configuration) {
      this.$store.dispatch('initialiseApp', configuration).then((result) => {
        if (result.tokenAcquired) {
          this.message = 'resource has been acquired. <br/><br/>'
          this.page = 'token'
          this.$emit('paymentEvent', { opcode: 'lsat-payment-confirmed', productId: configuration.productId, resource: result.resource })
        } else {
          this.$store.dispatch('startListening')
          this.page = 'invoice'
        }
      })
    },
    paymentEvent: function (data) {
      if (data.opcode === 'payment-expired') {
        this.paymentExpired()
      } else {
        this.page = 'result'
        this.result = data
      }
      this.$emit('paymentEvent', data)
    },
    paymentExpired () {
      this.$store.dispatch('fetchRates')
    }
  }
}
</script>
<style lang="scss">
@import "@/assets/scss/lsat-custom.scss";
</style>
