<template>
<div>
  <div class="spacer">
    <div title="Make Payment" v-if="payment">
      <div class="mb-3">
        <canvas ref="lndQrcode"></canvas>
      </div>
      <div class="d-flex justify-content-center" style="display: hidden;">
        <input class="input2" readonly="true" ref="paymentAddressBtc"  @click="copyAddress($event)" :value="paymentRequest" placeholder="Lightning invoice"/>
      </div>
      <a class="copyAddress" href="#" @click="copyUri($event)" style="text-decoration: none;">
        <span>Copy the address</span> <font-awesome-icon width="15px" height="15px" icon="copy"/>
      </a>
    </div>
    <div title="Open Channel" v-else>
      <div class="text-info scan-text">
        For better connectivity you can open a lightning channel.
      </div>
      <div class="d-flex justify-content-center mb-3">
        <canvas ref="lndChannel"></canvas>
      </div>
      <div class="d-flex justify-content-center">
        <input class="input2" readonly="true" ref="paymentUriBtc"  @click="copyUri($event)" :value="channel" placeholder="Lightning channel"/>
      </div>
    </div>
  </div>
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
  name: 'LightningPaymentAddress2',
  components: {
  },
  props: ['value'],
  data () {
    return {
      showChannel: false,
      token: null,
      channel: null,
      peerAddress: null,
      payment: true
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
    copyAddress () {
      var copyText = this.$refs.paymentAddressBtc
      copyText.select()
      document.execCommand('copy')
      // this.$notify({ type: 'success', title: 'Copied Address', text: 'Copied the address to clipboard: ' + copyText.value })
    },
    copyUri () {
      var copyText = this.$refs.paymentUriBtc
      copyText.select()
      document.execCommand('copy')
      // this.$notify({ type: 'success', title: 'Copied Channel Uri', text: 'Copied the channel uri to clipboard: ' + copyText.value })
    }
  },
  computed: {
    paymentRequest () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return paymentChallenge.lsatInvoice.paymentRequest
    },
    paymentAmountSat () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return paymentChallenge.xchange.amountSat
    },
    paymentAmountBtc () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return paymentChallenge.xchange.amountBtc
    }
  }
}
</script>
<style >
.spacer {
  width: 272px;
  height: 242px;
}
.copyAddress {
  text-align: left;
  text-decoration: underline;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
}
.copyAddress a {
  text-decoration: none;;
}
canvas {
  width: 80%;
  height: 80%;
  border: 1pt solid #333;
}
.input2 {
  width: 100%;
  background: #F5F5F5 0% 0% no-repeat padding-box;
  border-radius: 11px;
  opacity: 0.51;
  padding: 10px;
  border: none;
  margin-top: 10px;
}
.scan-text {
  text-align: left;
  font-size: 15px;
  font-weight: 300;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
  margin-top: 15px;
}
</style>
