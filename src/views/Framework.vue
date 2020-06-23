<template>
<waiting-view v-if="loading" />
<b-card-group :class="(updatingCredits) ? 'updating-credits' : ''" v-else>
  <b-card header-tag="header" footer-tag="footer">
    <crypto-picker class="mb-1 d-flex justify-content-left" :paymentOption="paymentOption" @updatePaymentOption="updatePaymentOption" />
    <crypto-stepper  class="mb-3 d-flex justify-content-left" @updateCredits="updateCredits" />
    <crypto-equality class="mb-5 d-flex justify-content-left" :paymentOption="paymentOption"/>
    <crypto-countdown v-if="paymentOption !== 'ethereum'" class="mb-1 rd-text d-flex justify-content-center" @evPaymentExpired="evPaymentExpired" @evTimeout="evTimeout" />
    <b-card-text v-if="enabling" class="my-5 rd-text">
      <div class="container">
        <div class="mb-5 d-flex justify-content-center">
          Enabling meta mask... {{message}}
        </div>
        <div class="d-flex justify-content-center">
          <b-button href="#" class="btn btn-dark border btn-lg text-warning" @click.prevent="enableMM()">Enable Meta Mask</b-button>
        </div>
      </div>
      <b-card-text class="mb-3" v-if="paying">
        <!-- <loopbomb-spinner :message="message"/> -->
      </b-card-text>
    </b-card-text>
    <b-card-text v-else class="mb-3">
      <div class="container" v-if="!timeout">
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
import WaitingView from './components/WaitingView'

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
    CryptoCountdown,
    WaitingView
  },
  data () {
    return {
      numbCredits: 2,
      updatingCredits: false,
      timeout: false,
      enabling: false,
      message: null,
      paying: false,
      paymentOption: null,
      waitingMessage: 'Loading payment options...',
      resizeTimer: null,
      loading: true,
      fullPage: true
    }
  },
  mounted () {
    const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
    this.paymentOption = configuration.paymentOption
    this.loading = false
  },
  methods: {
    paymentEvent: function (data) {
      if (data.opcode === 'eth-payment-begun1') {
        this.paying = true
        this.message = 'Sending payment ... takes up to a minute.'
      } else if (data.opcode === 'eth-payment-begun2') {
        this.paying = true
        this.message = 'Payment successful - starting...'
      } else if (data.opcode === 'eth-payment-begun3') {
        this.paying = false
      } else {
        this.paying = false
        this.$emit('paymentEvent', data)
      }
    },
    enableMM: function (data) {
      this.$store.dispatch('ethereumStore/enable').then((result) => {
        this.enabling = false
      }).catch((e) => {
        this.message = e.message
        this.enabling = true
      })
    },
    evPaymentExpired () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.loading = true
      this.$store.dispatch('deleteExpiredPayment').then(() => {
        this.$store.dispatch('reinitialiseApp', configuration).then(() => {
          this.loading = false
        })
      })
    },
    evTimeout () {
      this.timeout = true
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.loading = true
      this.$store.dispatch('deleteExpiredPayment').then(() => {
        this.$store.dispatch('reinitialiseApp', configuration).then(() => {
          this.loading = false
          // let the lsat-entry watcher on paymentChallenge handle updates.
        })
      })
    },
    updatePaymentOption (paymentOption) {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.paymentOption = paymentOption
      configuration.paymentOption = paymentOption
      this.$store.commit('addPaymentConfig', configuration)
      if (paymentOption === 'ethereum') {
        this.enableMM()
      }
    },
    updateCredits (credits) {
      clearTimeout(this.resizeTimer)
      const $self = this
      this.updatingCredits = true
      this.resizeTimer = setTimeout(function () {
        $self.$store.dispatch('updateAmount', { numbCredits: credits }).then(() => {
          // $self.$emit('paymentEvent', { opcode: 'lsat-payment-credits', numbCredits: credits, paymentId: paymentChallenge.paymentId })
          $self.updatingCredits = false
        })
      }, 500)
    }
  },
  computed: {
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
