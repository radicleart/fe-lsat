<template>
<div class="vld-parent d-flex flex-column align-items-center">
  <loading :active.sync="loading"
    :can-cancel="true"
    :on-cancel="onCancel"
    :is-full-page="fullPage"></loading>

  <div class="mt-3 rd-text d-flex flex-column align-items-center" style="" v-if="loading">
     <span class="text-warning">{{waitingMessage}}</span>
  </div>
  <div class="rd-text mt-3 d-flex flex-column align-items-center" v-else>
    <b-button href="#" class="mb-5 btn btn-dark border btn-lg text-warning" @click.prevent="sendPayment()">Pay with Meta Mask</b-button>
    <span class="text-danger">{{errorMessage}}</span>
  </div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
// Import component
import Loading from 'vue-loading-overlay'
// Import stylesheet
// import 'vue-loading-overlay/dist/vue-loading.css'

const NETWORK = process.env.VUE_APP_NETWORK

// noinspection JSUnusedGlobalSymbols
export default {
  name: 'EthereumPaymentAddress',
  components: {
    Loading
  },
  props: {
  },
  data () {
    return {
      loading: false,
      fullPage: true,
      errorMessage: null,
      waitingMessage: 'Open Meta Mask to proceed (sending transactions to the ethereum network takes a minute or so...)'
    }
  },
  watch: {
  },
  mounted () {
  },
  computed: {
  },

  methods: {
    sendPayment () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      this.loading = true
      this.waitingMessage = 'Processing Payment'
      this.$emit('paymentEvent', { opcode: 'eth-payment-begun1' })
      this.$store.dispatch('ethereumStore/transact', { opcode: 'send-payment', amount: paymentChallenge.xchange.amountEth }).then((result) => {
        const data = { status: 10, opcode: 'eth-payment-confirmed', txId: result.txId }
        const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
        // this.$emit('paymentEvent', { opcode: 'eth-payment-begun2' })
        this.$emit('paymentEvent', paymentEvent)
        this.$store.dispatch('receivePayment', paymentEvent).then((result) => {
          this.waitingMessage = 'Processed Payment'
          this.loading = false
          // this.$emit('paymentEvent', paymentEvent)
        })
      }).catch((e) => {
        this.errorMessage = 'Please ensure you are logged into your meta mask account on the ' + NETWORK + ' network'
        this.loading = false
      })
    },
    onCancel () {
      this.loading = false
    }
  }
}
</script>
<style lang="scss">
@import "@/assets/scss/lsat-custom.scss";
.tab-content {
  padding-top: 0px;
}
</style>
