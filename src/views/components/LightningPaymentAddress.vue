<template>
<div class="mt-3 d-flex flex-column align-items-center">
  <b-tabs content-class="mt-3" class="text-center" style="width: 100%">
    <b-tab title="Make Payment" active>
      <div class="mb-3">
        <canvas ref="lndQrcode"></canvas>
      </div>
      <div class="rd-text mb-3 d-flex justify-content-center">
        <span @click.prevent="addQrCode()"><small>Send the indicated amount to the address below</small></span>
      </div>
      <b-input-group class="mb-3">
        <b-form-input readonly ref="paymentAmountBtc" style="height: 50px; text-align: center;" :value="paymentAmount" placeholder="Bitcoin amount"></b-form-input>
      </b-input-group>
      <b-input-group class="mb-3">
        <b-form-input readonly ref="paymentAddressBtc" style="height: 50px;" :value="paymentRequest" placeholder="Bitcoin address"></b-form-input>
        <b-input-group-append>
          <b-button class="bg-light" @click="copyAddress($event)"><font-awesome-icon width="15px" height="15px" icon="copy"/></b-button>
        </b-input-group-append>
      </b-input-group>
    </b-tab>
    <b-tab title="Open Channel">
      <div class="rd-text d-flex justify-content-center text-center mb-3">
        <span><small>For better connectivity you can open a lightning channel.</small></span>
      </div>
      <div class="d-flex justify-content-center mb-3">
        <canvas ref="lndChannel"></canvas>
      </div>
      <div class="d-flex justify-content-center">
        <b-input-group class="mb-3">
          <b-input-group-prepend>
            <span class="input-group-text"><i class="fas fa-address-book"></i></span>
          </b-input-group-prepend>
          <b-form-input v-if="channel" readonly ref="paymentUriBtc" style="height: 50px;" :value="channel" placeholder="Lightning channel"></b-form-input>
          <b-input-group-append>
            <b-button class="bg-light" @click="copyUri($event)"><font-awesome-icon width="15px" height="15px" icon="copy"/></b-button>
          </b-input-group-append>
        </b-input-group>
      </div>
    </b-tab>
  </b-tabs>
</div>
</template>

<script>
import QRCode from 'qrcode'
import Vue from 'vue'
import axios from 'axios'
import { LSAT_CONSTANTS } from '@/lsat-constants'

const API_PATH = process.env.VUE_APP_RADICLE_API
// noinspection JSUnusedGlobalSymbols
export default {
  name: 'LightningPaymentAddress',
  components: {
  },
  props: ['value'],
  data () {
    return {
      showChannel: false,
      token: null,
      channel: null,
      peerAddress: null
    }
  },
  beforeDestroy () {
    this.$store.dispatch('stopListening')
  },
  mounted () {
    Vue.nextTick(function () {
      this.addQrCode()
    }, this)
    this.fetchInfo()
    this.peerAddress = '178.79.138.62:10011'
    if (location.href.indexOf('local') > -1) {
      this.peerAddress = '192.168.1.50:10011'
    }
  },
  methods: {
    addQrCode () {
      var element = this.$refs.lndQrcode
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      const paymentUri = 'lightning:' + paymentChallenge.lsatInvoice.paymentRequest
      QRCode.toCanvas(element, paymentUri, { errorCorrectionLevel: 'H' },
        function (error) {
          if (error) console.error(error)
          console.log('success!')
        })
    },
    addChannelQrCode () {
      var element = this.$refs.lndChannel
      this.channel = this.info.identityPubkey_ + '@' + this.peerAddress
      QRCode.toCanvas(
        element, this.channel, { errorCorrectionLevel: 'H' },
        function (error) {
          if (error) console.error(error)
          console.log('success!')
        })
    },
    fetchInfo () {
      const headers = this.$store.getters[LSAT_CONSTANTS.GET_HEADERS]
      axios({
        method: 'get',
        url: API_PATH + '/lsat/v1/lightning/alice/getInfo',
        headers: headers
      }).then(response => {
        this.info = response.data
        this.addChannelQrCode()
      })
        .catch((error) => {
          console.log(error)
        })
    },
    copyAmount () {
      var copyText = this.$refs.paymentAmountBtc
      copyText.select()
      document.execCommand('copy')
      this.$notify({ type: 'success', title: 'Copied Address', text: 'Copied the address to clipboard: ' + copyText.value })
    },
    copyAddress () {
      var copyText = this.$refs.paymentAddressBtc
      copyText.select()
      document.execCommand('copy')
      this.$notify({ type: 'success', title: 'Copied Address', text: 'Copied the address to clipboard: ' + copyText.value })
    },
    copyUri () {
      var copyText = this.$refs.paymentUriBtc
      copyText.select()
      document.execCommand('copy')
      this.$notify({ type: 'success', title: 'Copied Channel Uri', text: 'Copied the channel uri to clipboard: ' + copyText.value })
    }
  },
  computed: {
    paymentRequest () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return paymentChallenge.lsatInvoice.paymentRequest
    },
    paymentAmount () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      if (paymentChallenge.xchange.amountSat && paymentChallenge.lsatInvoice.numSatoshis) {
        return paymentChallenge.xchange.amountSat + ' satoshis ( ' + paymentChallenge.xchange.amountBtc + ' btc)'
      }
      return '??'
    }
  }
}
</script>
<style scoped>
.tab-content {
  padding-top: 0px;
}
canvas {
  max-width: 310px;
  max-height: 320px;
}

</style>
