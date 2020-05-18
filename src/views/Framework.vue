<template>
<b-card-group :class="(updatingCredits) ? 'updating-credits' : ''">
  <b-card header-tag="header" footer-tag="footer">
    <crypto-picker class="mb-1 d-flex justify-content-left" :paymentOption="paymentOption" @updatePaymentOption="updatePaymentOption" />
    <crypto-stepper  class="mb-3 d-flex justify-content-left" @updateCredits="updateCredits" />
    <crypto-equality class="mb-5 d-flex justify-content-left" :paymentOption="paymentOption"/>
    <crypto-countdown  class="mb-1 rd-text d-flex justify-content-center" @evPaymentExpired="evPaymentExpired" />
    <b-card-text class="mb-3" v-if="!timeout">
      <div class="container">
        <div class="d-flex justify-content-center">
          <lightning-payment-address v-if="paymentOption === 'lightning'"/>
          <bitcoin-payment-address v-if="paymentOption === 'bitcoin'"/>
          <ethereum-payment-address v-if="paymentOption === 'ethereum'" @paymentEvent="paymentEvent"/>
          <stacks-payment-address v-if="paymentOption === 'stacks'"/>
        </div>
        <notifications position="top right" width="30%" />
      </div>
    </b-card-text>
  </b-card>
</b-card-group>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import CryptoCountdown from './components/CryptoCountdown'
import LightningPaymentAddress from './components/LightningPaymentAddress'
import BitcoinPaymentAddress from './components/BitcoinPaymentAddress'
import EthereumPaymentAddress from './components/EthereumPaymentAddress'
import StacksPaymentAddress from './components/StacksPaymentAddress'
import CryptoStepper from './components/CryptoStepper'
import CryptoPicker from './components/CryptoPicker'
import CryptoEquality from './components/CryptoEquality'

export default {
  name: 'Framework',
  components: {
    LightningPaymentAddress,
    BitcoinPaymentAddress,
    StacksPaymentAddress,
    EthereumPaymentAddress,
    CryptoStepper,
    CryptoPicker,
    CryptoEquality,
    CryptoCountdown
  },
  data () {
    return {
      paymentOption: 'lightning',
      numbCredits: 2,
      updatingCredits: false,
      timeout: false
    }
  },
  mounted () {
  },
  methods: {
    paymentEvent: function (data) {
      this.page = 'ethConf'
      this.$emit('paymentEvent', data)
    },
    evPaymentExpired () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.$store.dispatch('deleteExpiredPayment').then(() => {
        this.$store.dispatch('reinitialiseApp', configuration)
      })
    },
    evTimeout () {
      this.timeout = true
    },
    updatePaymentOption (paymentOption) {
      this.paymentOption = paymentOption
    },
    updateCredits (credits) {
      // const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      var resizeTimer
      clearTimeout(resizeTimer)
      const $self = this
      this.updatingCredits = true
      resizeTimer = setTimeout(function () {
        $self.$store.dispatch('updateAmount', { numbCredits: credits }).then(() => {
          // $self.$emit('paymentEvent', { opcode: 'lsat-payment-credits', numbCredits: credits, paymentId: paymentChallenge.paymentId })
          $self.updatingCredits = false
        })
      }, 700)
    }
  },
  computed: {
    paymentChallenge () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return paymentChallenge
    }
  }
}
</script>
<style lang="scss">
.f-symbol {
  font-size: 1.2rem;
  padding-top: 10px;
}
.updating-credits {
  opacity: 0.5;
  background: green;
}
</style>
