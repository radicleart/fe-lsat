<template>
<div class="d-flex flex-column align-items-center">
  <div class="mb-3 mx-auto">
    <canvas  ref="lndQrcode"></canvas>
  </div>
  <div class="mb-3 d-flex justify-content-center">
    <span><small>Send the indicated amount to the address below</small></span>
  </div>
  <b-input-group class="mb-3">
    <b-input-group-prepend>
      <span class="input-group-text"><i class="fab fa-btc"></i></span>
    </b-input-group-prepend>
    <b-form-input readonly id="payment-amount-btc" style="height: 50px;" :value="paymentAmount" placeholder="Bitcoin amount"></b-form-input>
    <b-input-group-append>
      <b-button class="bg-light" @click="copyAmount($event)"><i class="far fa-copy"></i></b-button>
    </b-input-group-append>
  </b-input-group>
  <b-input-group class="mb-3">
    <b-input-group-prepend>
      <span class="input-group-text"><i class="fas fa-address-book"></i></span>
    </b-input-group-prepend>
    <b-form-input readonly id="payment-address-btc" style="height: 50px;" :value="paymentAddress" placeholder="Bitcoin address"></b-form-input>
    <b-input-group-append>
      <b-button class="bg-light" @click="copyAddress($event)"><i class="far fa-copy"></i></b-button>
    </b-input-group-append>
  </b-input-group>
</div>
</template>

<script>
import QRCode from 'qrcode'
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'BitcoinPaymentAddress',
  components: {
  },
  data () {
    return {
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
  computed: {
    paymentAmount () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration.value.amountBtc
    },
    paymentAddress () {
      const address = this.$store.getters[LSAT_CONSTANTS.KEY_BITCOIN_ADDRESS]
      return address
    }
  },

  methods: {
    paymentUri () {
      const address = this.$store.getters[LSAT_CONSTANTS.KEY_BITCOIN_ADDRESS]
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      let uri = 'bitcoin:' + address
      uri += '?amount=' + configuration.value.amountBtc
      uri += '&label=' + configuration.productId
      return uri
    },
    addQrCode () {
      var element = this.$refs.lndQrcode
      const paymentUri = this.paymentUri()
      QRCode.toCanvas(
        element, paymentUri, { errorCorrectionLevel: 'H' },
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
  }
}
</script>
<style scoped>
.tab-content {
  padding-top: 0px;
}
</style>
