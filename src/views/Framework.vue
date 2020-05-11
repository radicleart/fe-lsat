<template>
<b-card-group class="text-warning">
  <b-card header-tag="header" footer-tag="footer">
    <b-card-text class="d-flex justify-content-center">
      <b-form-group>
        <b-form-radio-group
          v-model="paymentOption"
          :options="options"
          name="radio-inline"
        ></b-form-radio-group>
      </b-form-group>
    </b-card-text>
    <b-card-text class="d-flex justify-content-center">
      <div class="">
        <span style="font-size: 1.2rem;" v-html="currentSymbol"></span>
        <input readonly="true" class="rd-input" id="input-horizontal2" :value="currentAmount" placeholder="$$$"/>
        &nbsp;<i class="ml-0 fa fa-equals"></i>
        <input readonly="true" class="total-amount-fiat rd-input" id="input-horizontal3" :value="configuration.value.amountFiat" placeholder="$$$"/>
        {{configuration.value.fiatCurrency}}
      </div>
    </b-card-text>
    <b-card-text>
      <div class="text-center">
        <countdown class="mt-3" v-if="timeout" @clockReset="clockReset" :timeout="timeout"/>
      </div>
      <div class="text-center mb-3" v-if="showExpiry">
        <span><small>{{configuration.value.amountFiat}} {{configuration.value.fiatCurrency}}</small></span>
        <span><small>Expires {{created()}}</small></span>
      </div>
    </b-card-text>
    <div v-if="expired">
      Invoice has expired - <a href="#" @click.prevent="evPaymentExpired">please start again</a>
    </div>
    <b-card-text>
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
import Countdown from './components/Countdown'
import LightningPaymentAddress from './components/LightningPaymentAddress'
import BitcoinPaymentAddress from './components/BitcoinPaymentAddress'
import EthereumPaymentAddress from './components/EthereumPaymentAddress'
import StacksPaymentAddress from './components/StacksPaymentAddress'
import moment from 'moment'

export default {
  name: 'Framework',
  components: {
    LightningPaymentAddress,
    BitcoinPaymentAddress,
    StacksPaymentAddress,
    EthereumPaymentAddress,
    Countdown
  },
  data () {
    return {
      paymentOption: 'lightning',
      expired: false,
      timeout: null, // { hours: 1, minutes: 0, seconds: 0 },
      showExpiry: false,
      options: [
        { text: 'Ether', value: 'ethereum' },
        { text: 'Bitcoin', value: 'bitcoin' },
        { text: 'Lightning', value: 'lightning' },
        { text: 'Stacks', value: 'stacks' }
      ]
    }
  },
  mounted () {
    const expired = this.$store.getters[LSAT_CONSTANTS.KEY_LSAT_EXPIRED]
    if (expired) {
      this.expired = true
    }
    this.timeout = this.$store.getters[LSAT_CONSTANTS.KEY_LSAT_DURATION]
  },
  methods: {
    paymentEvent: function (data) {
      this.page = 'ethConf'
      this.$emit('paymentEvent', data)
    },
    clockReset () {
      this.$store.dispatch('fetchRates')
      this.expired = true
    },
    created () {
      const lsat = this.$store.getters[LSAT_CONSTANTS.KEY_LSAT]
      var created = lsat.timeCreated + 3600000
      return moment(created).format('YYYY-MM-DD HH:mm')
    },
    evPaymentExpired () {
      const lsat = this.$store.getters[LSAT_CONSTANTS.KEY_LSAT]
      this.$emit('paymentEvent', { opcode: 'payment-expired', productId: this.productId, lsat: lsat })
    }
  },
  computed: {
    configuration () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      if (configuration && configuration.value) {
        return configuration
      }
      return { value: { amountBtc: 0 } }
    },
    currentSymbol () {
      if (this.paymentOption === 'ethereum') {
        return 'Ξ'
      } else if (this.paymentOption === 'stacks') {
        return '~ &#931'
      } else {
        return '&#x20BF;'
      }
    },
    currentAmount () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      if (this.paymentOption === 'ethereum') {
        return configuration.value.amountEth
      } else if (this.paymentOption === 'stacks') {
        return configuration.value.amountBtc / 1000
      } else {
        return configuration.value.amountBtc
      }
    }
  }
}
</script>
<style lang="scss">
</style>
