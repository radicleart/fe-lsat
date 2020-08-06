<template>
<waiting-view v-if="loading" />
<div class="d-flex justify-content-center" v-else>
<div class="mx-auto my-5">
<b-card-group :class="(updatingCredits) ? 'updating-credits' : ''" :key="componentKey" :style="lookAndFeel.cardStyle">
  <b-card header-tag="header" footer-tag="footer" :style="background">
    <template v-slot:header class="">
      <div class="d-flex justify-content-center"><span class="title">{{lookAndFeel.labels.title}}</span>&nbsp;<span class="subtitle">{{lookAndFeel.labels.subtitle}}</span></div>
    </template>

    <div v-if="displayCard === 0">
      <div class="w-75 purpose border-bottom pb-3 mb-3" v-html="lookAndFeel.labels.orderMsg"></div>
      <crypto-stepper-v2 v-if="showStepper" :paymentOption="paymentOption" :lookAndFeel="lookAndFeel" @updateCredits="updateCredits" />
      <div class="text-center my-4 d-flex justify-content-center">
        <button class="place-order" @click="next">
          <span class="place-order-text">
            Place your order
            <font-awesome-icon class="ml-5" width="15px" height="15px" icon="qrcode"/>
          </span>
        </button>
      </div>
    </div>

    <div  v-if="displayCard === -1">
      <crypto-picker :lookAndFeel="lookAndFeel" :paymentOption="paymentOption" @updatePaymentOption="updatePaymentOption" />
      <div class="mx-auto w-75">{{lookAndFeel.labels.networkMsg}}</div>
    </div>

    <div v-if="displayCard === 1">
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
        <div class="mb-4">You placed the following order:</div>
        <div class="mt-2 d-flex justify-content-between border-bottom pb-4 mb-4">
          <div class="text-warning">{{currentQuantity}} {{quantityLabel}}</div>
          <div class="text-warn"><span v-html="currentSymbol"></span> {{currentAmount}}</div>
        </div>
        <div class="mt-2 d-flex justify-content-between mb-4">
          <crypto-countdown v-if="paymentOption !== 'ethereum'" class="mb-1 rd-text d-flex justify-content-end" @evPaymentExpired="evPaymentExpired" @evTimeout="evTimeout" />
          <div class="text-warn"><b-button sm class="bg-danger" @click="next()">Cancel Order</b-button></div>
        </div>
        <div class="mt-2 d-flex justify-content-center mb-4">
          <div class="scanner">Scan the QR Code with your Lightning Wallet</div>
        </div>
        <div class="" v-if="!timeout">
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
      <div>
        <b-form-input id="range-2" v-model="value" type="range" min="0" max="2" step="1"></b-form-input>
        <div class="mt-2 d-flex justify-content-between" style="font-size: 8px;">
          <div class="">Place Order {{ value }}</div>
          <div class="">Scan with Lightning Wallet</div>
          <div class="">Receive Goods</div>
        </div>
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
      value: 0,
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
      this.value = displayCard
      if (displayCard === 1) {
        this.value = 1
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
      this.value = displayCard
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
    currentQuantity () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration.creditAttributes.start
    },
    quantityLabel () {
      if (this.lookAndFeel && this.lookAndFeel.labels && this.lookAndFeel.labels.quantityLabel) {
        return this.lookAndFeel.labels.quantityLabel
      }
      return 'items'
    },
    showStepper () {
      if (this.lookAndFeel && this.lookAndFeel.sections) {
        return this.lookAndFeel.sections.stepper
      }
      return true
    },
    background () {
      return (this.lookAndFeel) ? this.lookAndFeel.background : ''
    },
    currentSymbol () {
      if (this.paymentOption === 'ethereum') {
        return 'Ξ'
      } else if (this.paymentOption === 'stacks') {
        return '&#931;'
      } else {
        return '&#x0e3f;' // '&#x20BF;' // '&#8383;'
      }
    },
    currentAmount () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      if (paymentChallenge.xchange) {
        if (this.paymentOption === 'ethereum') {
          return paymentChallenge.xchange.amountEth
        } else if (this.paymentOption === 'stacks') {
          return paymentChallenge.xchange.amountStx
        } else {
          return paymentChallenge.xchange.amountBtc
        }
      } else {
        return 0
      }
    },
    displayCard () {
      const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      return displayCard
    }
  }
}
</script>
<style lang="scss" scoped>
@import "@/assets/scss/customv2.scss";
.title {
  font-weight: 300;
  font-size: 14px;
  letter-spacing: 0px;
  color: #000000;
  margin-right: 5px;
}
.scanner {
  text-align: center;
  font-weight: 500;
  font-size: 12px;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
}
.subtitle {
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0px;
  color: #FFCE00;
}
.card-group {
  margin: 10px 10px 10px 10px;
  font-family: 'Montserat', sans-serif;
  min-width: 350px;
  min-height: 500px;
}
.card-header {
  background-color: #fff;
}
.card-footer {
  background-color: #fff;
}
.place-order {
  width: 191px;
  height: 51px;
  background: #FFCE00 0% 0% no-repeat padding-box;
  box-shadow: 0px 3px 6px #00000029;
  border-radius: 10px;
  opacity: 1;
}
.place-order-text {
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
}
.b-prev {
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
  border-radius: 25px;
}
.purpose {
  text-align: left;
  font-weight: 200;
  font-size: 10px;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
}
.b-next:hover {
  background: #F9B807 0% 0% no-repeat padding-box;
  opacity: 1;
}

input[type=range] {
  -webkit-appearance: none; /* Hides the slider so that custom slider can be made */
  width: 100%; /* Specific width is required for Firefox. */
  background: transparent; /* Otherwise white in Chrome */
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
}

input[type=range]:focus {
  outline: none; /* Removes the blue border. You should probably do some kind of focus styling for accessibility reasons though. */
}

input[type=range]::-ms-track {
  width: 100%;
  cursor: pointer;

  /* Hides the slider so custom styles can be added */
  background: transparent;
  border-color: transparent;
  color: transparent;
}
input[type=range]:focus::-webkit-slider-runnable-track {
  background: #ccc;
}
input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 4.2px;
  cursor: pointer;
  box-shadow: 1px 1px 1px #ccc, 0px 0px 1px #0d0d0d;
  background: #ccc;
  border-radius: 1.3px;
  border: 0.2px solid #ccc;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  border: 1px solid #000000;
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  margin-top: -7px; /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
  box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d; /* Add cool effects to your sliders! */
}
</style>
