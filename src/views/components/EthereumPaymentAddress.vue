<template>
<div class="mt-3 rd-text d-flex flex-column align-items-center" style="height: 100vh;" v-if="loading">
  {{waitingMessage}}
</div>
<div class="rd-text mt-3 d-flex flex-column align-items-center" v-else>
  <b-button href="#" class="mb-5 btn btn-dark border btn-lg text-warning" @click.prevent="sendPayment()">Pay with Meta Mask</b-button>
  {{errorMessage}}
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
const NETWORK = process.env.VUE_APP_NETWORK

// noinspection JSUnusedGlobalSymbols
export default {
  name: 'EthereumPaymentAddress',
  components: {
  },
  props: {
  },
  data () {
    return {
      loading: false,
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
      this.$store.dispatch('ethereumStore/transact', { opcode: 'send-payment', amount: paymentChallenge.xchange.amountEth }).then((result) => {
        const data = { status: 10, opcode: 'eth-payment-confirmed', txId: result.txId }
        const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
        this.$store.dispatch('receivePayment', paymentEvent).then((result) => {
          this.$emit('paymentEvent', paymentEvent)
          this.waitingMessage = result.message
        })
      }).catch((e) => {
        this.errorMessage = 'Please ensure you are logged into your meta mask account on the ' + NETWORK + ' network'
        this.loading = false
      })
    }
  }
}
</script>
<style scoped>
.tab-content {
  padding-top: 0px;
}
</style>
