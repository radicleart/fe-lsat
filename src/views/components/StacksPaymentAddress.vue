<template>
<div class="d-flex flex-column align-items-center">
  <div class="mx-auto" v-if="!stacksSupported" style="height: 40vh;">
    <loading :active.sync="loading" class="text-center"
      :can-cancel="true"
      :on-cancel="onCancel"
      :is-full-page="fullPage"></loading>

    <div class="mt-3 rd-text d-flex flex-column align-items-center" style="" v-if="loading">
      <span class="text-warning">{{waitingMessage}}</span>
      <span class="text-warning"><a href="#" @click.prevent="onCancel">cancel</a></span>
    </div>
    <div class="mb-5 rd-text mt-3 d-flex flex-column align-items-center" v-else>
        <b-button href="#" class="mb-3 btn btn-dark border btn-lg text-warning" @click.prevent="sendPayment('blockstack')">Pay with Stacks</b-button>
        <b-button href="#" class="mb-3 btn btn-dark border btn-lg text-warning" @click.prevent="sendPayment('risidio')">Claim Fee Spins</b-button>
        <div class="text-right text-white" style="font-size: 11px;">
          <a href="https://testnet-explorer.blockstack.org/sandbox" class="text-white" target="_blank">Get Testnet STX</a>
        </div>
    </div>
    <div>
      <div class="text-danger" style="max-width: 800px;">{{errorMessage}}</div>
    </div>
  </div>
  <div class="mb-3 mx-auto" v-if="stacksSupported">
    <canvas id="qrcode"></canvas>
  </div>
  <div class="rd-text my-5 d-flex justify-content-center" v-if="stacksSupported">
    <span><small>Send the indicated amount to the address below</small></span>
  </div>
  <b-input-group class="mb-3" v-if="stacksSupported">
    <b-input-group-prepend>
      <span class="input-group-text"><i class="fab fa-btc"></i></span>
    </b-input-group-prepend>
    <b-form-input readonly id="payment-amount-btc" style="height: 50px;" :value="paymentAmount" placeholder="Bitcoin amount"></b-form-input>
    <b-input-group-append>
      <b-button class="bg-white text-dark" @click="copyAmount($event)"><font-awesome-icon width="15px" height="15px" icon="copy"/></b-button>
    </b-input-group-append>
  </b-input-group>
  <b-input-group class="mb-3" v-if="stacksSupported">
    <b-input-group-prepend>
      <span class="input-group-text"><i class="fas fa-address-book"></i></span>
    </b-input-group-prepend>
    <b-form-input readonly id="payment-address-btc" style="height: 50px;" :value="paymentAddress" placeholder="Stacks address"></b-form-input>
    <b-input-group-append>
      <b-button class="bg-white text-dark" @click="copyAddress($event)"><font-awesome-icon width="15px" height="15px" icon="copy"/></b-button>
    </b-input-group-append>
  </b-input-group>
</div>
</template>

<script>
import QRCode from 'qrcode'
import moment from 'moment'
import { LSAT_CONSTANTS } from '@/lsat-constants'
import Loading from 'vue-loading-overlay'

// noinspection JSUnusedGlobalSymbols
export default {
  name: 'StacksPaymentAddress',
  components: {
    Loading
  },
  props: {
  },
  data () {
    return {
      waitingMessage: 'Open Blockstack connect to proceed (sending transactions to the stacks network takes a minute or so...)',
      loading: false,
      fullPage: true,
      errorMessage: null
    }
  },
  watch: {
    'paymentAmount' () {
      this.addQrCode()
    }
  },
  mounted () {
    this.addQrCode()
  },
  methods: {
    sendPayment (provider) {
      this.loading = true
      this.waitingMessage = 'Processing Payment'
      this.$emit('paymentEvent', { opcode: 'stx-payment-begun1' })
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const data = {
        paymentAddress: configuration.addresses.stxPaymentAddress,
        contractAddress: configuration.addresses.stxContractAddress,
        contractName: configuration.addresses.stxContractName,
        functionName: 'get-base-token-uri',
        functionArgs: []
      }
      let action = 'wcStacksStore/makeTransferRisidio'
      if (provider === 'blockstack') {
        action = 'wcStacksStore/makeTransferBlockstack'
      }
      this.$store.dispatch('wcStacksStore/fetchMacsWalletInfo').then(() => {
        this.doTransfer(action, data)
      })
    },
    doTransfer (action, data) {
      this.$store.dispatch(action, data).then((result) => {
        const data = { status: 10, opcode: 'stx-payment-confirmed', result: result.result }
        const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
        // this.$emit('paymentEvent', paymentEvent)
        this.$store.dispatch('receivePayment', paymentEvent).then((result) => {
          this.waitingMessage = 'Processed Payment'
          this.loading = false
          this.$emit('paymentEvent', paymentEvent)
        })
      }).catch(() => {
        data.action = 'inc-nonce'
        this.$store.dispatch(action, data).then((result) => {
          const data = { status: 10, opcode: 'stx-payment-confirmed', result: result.result }
          const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
          // this.$emit('paymentEvent', paymentEvent)
          this.$store.dispatch('receivePayment', paymentEvent).then((result) => {
            this.waitingMessage = 'Processed Payment'
            this.loading = false
            this.$emit('paymentEvent', paymentEvent)
          })
        })
      })
    },
    onCancel () {
      this.loading = false
    },
    paymentUri () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      if (!configuration.addresses) return ''
      let uri = configuration.addresses.stxPaymentAddress
      uri += '?amount=' + paymentChallenge.xchange.amountStx
      return uri
    },
    addQrCode () {
      const $qrCode = document.getElementById('qrcode')
      const paymentUri = this.paymentUri()
      QRCode.toCanvas(
        $qrCode, paymentUri, { errorCorrectionLevel: 'H' },
        function () {})
    },
    copyAmount () {
      var copyText = document.getElementById('payment-amount-btc')
      copyText.select()
      document.execCommand('copy')
      this.$notify({ type: 'success', title: 'Copied Address', text: 'Copied the address to clipboard: ' + copyText.value })
    },
    copyAddress () {
      var copyText = document.getElementById('payment-address-btc')
      copyText.select()
      document.execCommand('copy')
      this.$notify({ type: 'success', title: 'Copied Address', text: 'Copied the address to clipboard: ' + copyText.value })
    }
  },
  computed: {
    myProfile () {
      const blockstackProfile = this.$store.getters['authStore/getMyProfile']
      return blockstackProfile
    },
    currentTime () {
      const serverTime = this.$store.getters.serverTime
      return moment(serverTime).format('HH:mm:ss')
    },
    stacksSupported () {
      return false
    },
    paymentAmount () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return paymentChallenge.xchange.amountStx
    },
    paymentAddress () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      if (!configuration.addresses) return ''
      return configuration.addresses.stxPaymentAddress
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
