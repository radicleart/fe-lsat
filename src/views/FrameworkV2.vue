<template>
<waiting-view v-if="loading" />
<div class="d-flex justify-content-center" v-else>
<div class="mx-auto my-5">
<b-card-group :class="(updatingCredits) ? 'updating-credits' : ''" :key="componentKey" :style="lookAndFeel.cardStyle">
  <b-card header-tag="header" footer-tag="footer" :style="lookAndFeel.background">
    <template v-slot:header>
      <h1 class="mb-2">{{lookAndFeel.labels.title}}</h1>
      <h2 class="mb-0">{{lookAndFeel.labels.subtitle}}</h2>
    </template>
    <div v-if="displayCard === 0">
      <div class="my-5 mx-auto w-100" v-html="lookAndFeel.labels.orderMsg"></div>
      <crypto-stepper-v2 v-if="showStepper" class="mb-3 d-flex justify-content-left" :paymentOption="paymentOption" :lookAndFeel="lookAndFeel" @updateCredits="updateCredits" />
    </div>
    <div  v-if="displayCard === -1">
      <crypto-picker :lookAndFeel="lookAndFeel" :paymentOption="paymentOption" @updatePaymentOption="updatePaymentOption" />
      <div class="mx-auto w-75">{{lookAndFeel.labels.networkMsg}}</div>
    </div>
    <div  v-if="displayCard === -2">
      <crypto-stepper v-if="showStepper" class="mb-3 d-flex justify-content-left" :paymentOption="paymentOption" :lookAndFeel="lookAndFeel" @updateCredits="updateCredits" />
      <div class="mx-auto w-75">{{lookAndFeel.labels.quantityMsg}}</div>
    </div>
    <div  v-if="displayCard === 1">
      <crypto-countdown v-if="paymentOption !== 'ethereum'" class="mb-1 rd-text d-flex justify-content-end" @evPaymentExpired="evPaymentExpired" @evTimeout="evTimeout" />
      <b-card-text v-if="enabling">
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
            <lightning-payment-address-v2 v-if="paymentOption === 'lightning'"/>
            <bitcoin-payment-address v-if="paymentOption === 'bitcoin'"/>
            <ethereum-payment-address v-if="paymentOption === 'ethereum'" @paymentEvent="paymentEvent"/>
            <stacks-payment-address v-if="paymentOption === 'stacks'"/>
          </div>
          <notifications position="top right" width="30%" />
        </div>
      </b-card-text>
    </div>
    <template v-slot:footer>
      <div class="text-center d-flex justify-content-between">
        <button :class="(showBack) ? 'b-prev' : ''"><span v-show="showBack" @click="prev">{{lookAndFeel.labels.button1Label}}</span></button>
        <button class="b-next" @click="next">{{button2Label}}</button>
      </div>
    </template>
  </b-card>
</b-card-group>
</div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import CryptoPicker from './components/v2/CryptoPicker'
import CryptoStepperV2 from './components/v2/CryptoStepperV2'
import LightningPaymentAddressV2 from './components/v2/LightningPaymentAddressV2'

import CryptoCountdown from './components/CryptoCountdown'
import BitcoinPaymentAddress from './components/BitcoinPaymentAddress'
import EthereumPaymentAddress from './components/EthereumPaymentAddress'
import StacksPaymentAddress from './components/StacksPaymentAddress'
import WaitingView from './components/WaitingView'

export default {
  name: 'FrameworkV2',
  components: {
    LightningPaymentAddressV2,
    BitcoinPaymentAddress,
    StacksPaymentAddress,
    EthereumPaymentAddress,
    CryptoStepperV2,
    CryptoPicker,
    CryptoCountdown,
    WaitingView
  },
  props: ['lookAndFeel'],
  data () {
    return {
      componentKey: 0,
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
    if (configuration.opcode === 'lsat-place-order') {
      this.$store.commit('setDisplayCard', 0)
    }
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
    next () {
      let displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      displayCard++
      if (displayCard > 1) {
        displayCard = 0
      }
      if (displayCard === 1) {
        const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
        this.$store.dispatch('reinitialiseApp', configuration).then((paymentChallenge) => {
          this.$store.commit('setDisplayCard', displayCard)
          this.$emit('paymentEvent', { opcode: 'lsat-payment-begun1', paymentChallenge: paymentChallenge })
          this.loading = false
        })
      } else {
        this.$store.commit('setDisplayCard', displayCard)
      }
    },
    prev () {
      let displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      displayCard--
      if (displayCard < 0) {
        displayCard = 0
      }
      this.$store.commit('setDisplayCard', displayCard)
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
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      clearTimeout(this.resizeTimer)
      const $self = this
      this.updatingCredits = true
      this.resizeTimer = setTimeout(function () {
        $self.$store.dispatch('updateAmount', { numbCredits: credits }).then(() => {
          $self.$store.commit('setDisplayCard', 0)
          $self.updatingCredits = false
          $self.componentKey++
          $self.$emit('paymentEvent', { opcode: 'lsat-payment-credits', numbCredits: credits, paymentId: configuration.paymentChallenge })
        })
      }, 500)
    }
  },
  computed: {
    showStepper () {
      if (this.lookAndFeel && this.lookAndFeel.sections) {
        return this.lookAndFeel.sections.stepper
      }
      return true
    },
    button2Label () {
      const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      let label = this.lookAndFeel.labels.button2Label
      if (displayCard === 1) {
        label = 'Cancel'
      } else if (displayCard === 0) {
        label = 'Place Order'
      }
      return label
    },
    displayCard () {
      const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      return displayCard
    },
    showBack () {
      const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      return displayCard > 0
    }
  }
}
</script>
<style lang="scss" scoped>
@import "@/assets/scss/customv2.scss";
.card-group {
  margin: 10px 10px 10px 10px;
  border: 0 solid #fff;
  font-family: 'Montserat', sans-serif;
  min-width: 350px;
  min-height: 500px;
}
.card-footer {
  margin: 0;
  text-align: center;
}
.b-prev {
  border: 1px solid #F9B807;
  opacity: 1;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1
}
.b-next {
  background: #F9B807 0% 0% no-repeat padding-box;
  opacity: 0.4;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0px;
  color: #FFFFFF;
  opacity: 0.7;
  margin-left: 5px;
}
.card {
  background-color: #fff !important;
  border: none;
  border-radius: 25px;
}
.b-next:hover {
  background: #F9B807 0% 0% no-repeat padding-box;
  opacity: 1;
}
h1 {
  text-align: left;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0px;
  text-transform: capitalize;
  opacity: 1;
}
h2 {
  font-size: 36px;
  font-weight: 200;
  letter-spacing: 0px;
  text-transform: capitalize;
  opacity: 1;
  white-space: normal;
}

</style>
