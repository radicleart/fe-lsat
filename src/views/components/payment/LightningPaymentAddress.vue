<template>
<div class="d-flex flex-column align-items-center">
  <countdown @clockReset="clockReset" :timeout="timeout"/>
  <div class="d-flex justify-content-center">
    <span><small>Invoice Expires {{created()}}</small></span>
  </div>
  <b-tabs content-class="mt-3" class="text-center" style="width: 100%">
    <b-tab title="Make Payment" active>
      <div>
        <canvas ref="lndQrcode"></canvas>
      </div>
      <div class="d-flex justify-content-center">
        <span @click.prevent="addQrCode()"><small>Send the indicated amount to the address below</small></span>
      </div>
      <b-input-group class="mb-3">
        <b-input-group-prepend>
          <span class="input-group-text"><i class="fab fa-btc"></i></span>
        </b-input-group-prepend>
        <b-form-input readonly ref="paymentAmountBtc" style="height: 50px;" :value="paymentAmount" placeholder="Bitcoin amount"></b-form-input>
        <b-input-group-append>
          <b-button class="bg-light" @click="copyAmount($event)"><i class="far fa-copy"></i></b-button>
        </b-input-group-append>
      </b-input-group>
      <b-input-group class="mb-3">
        <b-input-group-prepend>
          <span class="input-group-text"><i class="fas fa-address-book"></i></span>
        </b-input-group-prepend>
        <b-form-input readonly ref="paymentAddressBtc" style="height: 50px;" :value="paymentRequest" placeholder="Bitcoin address"></b-form-input>
        <b-input-group-append>
          <b-button class="bg-light" @click="copyAddress($event)"><i class="far fa-copy"></i></b-button>
        </b-input-group-append>
      </b-input-group>
    </b-tab>
    <b-tab title="Open Channel">
      <div class="d-flex justify-content-center text-center mb-3">
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
            <b-button class="bg-light" @click="copyUri($event)"><i class="far fa-copy"></i></b-button>
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
import Countdown from './Countdown'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'
import axios from 'axios'
import moment from 'moment'

const API_PATH = process.env.VUE_APP_RADICLE_API
let stompClient = null
let socket = null
// noinspection JSUnusedGlobalSymbols
export default {
  name: 'LightningPaymentAddress',
  components: {
    Countdown
  },
  props: ['lsatProduct'],
  data () {
    return {
      showChannel: false,
      token: null,
      timeout: { hours: 1, minutes: 0, seconds: 0 },
      info: null,
      channel: null,
      pubkeys: null,
      peerAddress: null
    }
  },
  beforeDestroy () {
    stompClient.disconnect()
  },
  mounted () {
    Vue.nextTick(function () {
      this.addQrCode()
    }, this)
    const $self = this
    socket = new SockJS(API_PATH + '/lsat/ws1/mynews')
    this.$store.dispatch('lookupInvoice', this.lsatProduct).then((lsatProduct) => {
      // this.$emit('openOrder', lsatProduct)
    })
    stompClient = Stomp.over(socket)
    stompClient.connect(
      {},
      function () {
        // const MYKEY = 'getTempUserId' // trick lint!
        // const tuid = this.$store.getters[MYKEY]
        stompClient.subscribe('/queue/mynews-' + $self.lsatProduct.lsat.paymentHash, function (response) {
          const settledInvoice = JSON.parse(response.body)
          $self.$store.dispatch('storePreimage', { productId: $self.lsatProduct.productId, settledInvoice: settledInvoice }).then((token) => {
            $self.$emit('storedPreimage', $self.lsatProduct.productId)
          })
        })
        stompClient.subscribe('/queue/mynews-' + 'rates', function (response) {
          const rates = JSON.parse(response.body)
          $self.rates = rates
        })
      },
      function (error) {
        console.log(error)
      }
    )
    this.fetchInfo()
    this.peerAddress = '178.79.138.62:10011'
    if (location.href.indexOf('localhost') > -1) {
      this.peerAddress = 'localhost:10011'
    }
    // this.fetchPeerInfo()
    // this.fetchPubkeys()
  },
  computed: {
    paymentRequest () {
      return this.lsatProduct.lsat.invoice
    },
    paymentAmount () {
      if (this.lsatProduct.lsat && this.lsatProduct.lsat.invoiceAmount) {
        const amtBtc = this.lsatProduct.lsat.invoiceAmount / 100000000
        return this.lsatProduct.lsat.invoiceAmount + ' satoshis ( ' + amtBtc + ' btc)'
      }
      return '??'
    }
  },
  methods: {
    created () {
      var created = this.lsatProduct.lsat.timeCreated
      return moment(created).format('YYYY-MM-DD HH:mm:SS')
    },
    addQrCode () {
      var element = this.$refs.lndQrcode
      const paymentUri = 'lightning:' + this.lsatProduct.lsat.invoice
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
      axios({
        method: 'get',
        url: API_PATH + '/lsat/v1/lightning/alice/getInfo',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(response => {
        this.info = response.data
        this.addChannelQrCode()
      })
        .catch((error) => {
          console.log(error)
        })
        // lightningState.peerAddress = "178.79.138.62:10011";
    },
    fetchPeerInfo () {
      axios({
        method: 'get',
        url: API_PATH + '/lsat/v1/lightning/{channel}/getNodeInfo/{pubkey}',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(response => {
        this.info = response.data
      })
        .catch((error) => {
          console.log(error)
        })
    },
    fetchPubkeys () {
      axios({
        method: 'get',
        url: API_PATH + '/lsat/v1/lightning/pubkeys',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(response => {
        this.pubkeys = response.data
      })
        .catch((error) => {
          console.log(error)
        })
    },
    clockReset () {
      this.$store.dispatch('conversionStore/fetchConversionData')
    },
    copyAmount () {
      // var copyText = document.getElementById('paymentAmountBtc')
      var copyText = this.$refs.paymentAmountBtc
      copyText.select()
      document.execCommand('copy')
      this.$notify({ type: 'success', title: 'Copied Address', text: 'Copied the address to clipboard: ' + copyText.value })
    },
    copyAddress () {
      // var copyText = document.getElementById('paymentAddressBtc')
      var copyText = this.$refs.paymentAddressBtc
      copyText.select()
      document.execCommand('copy')
      this.$notify({ type: 'success', title: 'Copied Address', text: 'Copied the address to clipboard: ' + copyText.value })
    },
    copyUri () {
      // var copyText = document.getElementById('paymentUriBtc')
      var copyText = this.$refs.paymentUriBtc
      copyText.select()
      document.execCommand('copy')
      this.$notify({ type: 'success', title: 'Copied Channel Uri', text: 'Copied the channel uri to clipboard: ' + copyText.value })
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
