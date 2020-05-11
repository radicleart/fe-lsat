<template>
<div class="d-flex flex-column align-items-center" style="height: 100vh;" v-if="loading">
  {{waitingMessage}}
</div>
<div class="d-flex flex-column align-items-center" v-else>
  <b-input-group class="mb-3">
    <span class="input-group-text"><a href="#" class="btn btn-warning btn-lg bg-warning" @click.prevent="sendPayment()">Pay with Meta Mask</a></span>
  </b-input-group>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

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
      waitingMessage: 'Sending transaction to ethereum network - takes a minute or so...'
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
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.loading = true
      this.$emit('paymentEvent', { opcode: 'eth-payment-waiting', message: this.waitingMessage })
      this.$store.dispatch('ethereumStore/transact', { opcode: 'send-payment', amount: configuration.value.amountEth }).then((result) => {
        result.opcode = 'eth-payment-confirmed'
        result.message = 'Payment received with thanks.'
        this.$emit('paymentEvent', result)
        this.loading = false
      }).catch((e) => {
        this.$emit('paymentEvent', { opcode: 'eth-payment-error', message: e.message })
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
