<template>
  <b-card-text>
    <div class="d-flex flex-column align-items-start">
      <p>{{lookAndFeel.labels.card2Label1}}</p>
      <div class="mb-3">
        <input readonly="true" class="input1" @input="updateCredits($event)" id="input-horizontal1" v-model="localCredits" placeholder="$$$"/>
        <span @click.prevent="countDown" class="stepper" style="cursor: pointer;"><span class="stepper-text">-</span></span>
        <span @click.prevent="countUp" class="stepper" style="cursor: pointer;"><span class="stepper-text">+</span></span>
      </div>
      <waiting-view v-if="loading"/>
      <div v-else>
        <div class="mb-3 w-75" style="white-space: nowrap;">
          <span class="symbol" v-html="currentSymbol"></span>
          <input class="input2" readonly="true" id="input-horizontal2" :value="currentAmount" placeholder="$$$"/>
        </div>
        <div class="mb-3 w-75" style="white-space: nowrap;">
          <span class="symbol" v-html="fiatSymbol"></span>
          <input class="input2" readonly="true" id="input-horizontal3" :value="formattedFiat" placeholder="$$$"/>
        </div>
      </div>
    </div>
  </b-card-text>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import WaitingView from '@/views/components/WaitingView'

export default {
  name: 'CryptoStepperV2',
  components: {
    WaitingView
  },
  props: ['lookAndFeel', 'paymentOption'],
  data () {
    return {
      localCredits: 2,
      loading: false
    }
  },
  mounted () {
    const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
    this.localCredits = paymentChallenge.xchange.numbCredits
  },
  methods: {
    countDown () {
      const config = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      if (this.localCredits <= config.creditAttributes.min) {
        return
      }
      if (this.localCredits === config.creditAttributes.min + 1) {
        this.localCredits--
      } else {
        this.localCredits -= config.creditAttributes.step
      }
      this.updateCredits()
    },
    countUp () {
      const config = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      if (this.localCredits >= config.creditAttributes.max) {
        return
      }
      this.localCredits += config.creditAttributes.step
      this.updateCredits()
    },
    updateCredits (evt) {
      let numbC = 0
      try {
        if (this.localCredits.length === 0) {
          return
        }
        if (isNaN(this.localCredits)) {
          this.$notify({ type: 'warn', title: 'Number of Credits', text: 'Credits must be a number between 2 and 20!' })
          this.localCredits = 2
          return
        }
        numbC = Number(this.localCredits)
        if (numbC < 1 || numbC > 20) {
          this.$notify({ type: 'warn', title: 'Number of Credits', text: 'Credits must be between 2 and 20!' })
          this.localCredits = 2
        }
      } catch (e) {
        this.$notify({ type: 'warn', title: 'Number of Credits', text: 'Credits must be between 2 and 20!' })
        this.localCredits = 2
      }
      this.loading = true
      this.$emit('updateCredits', this.localCredits)
    }
  },
  computed: {
    quantityLabel () {
      let ql = 'Spins'
      if (this.lookAndFeel && this.lookAndFeel.labels && this.lookAndFeel.labels.quantityLabel) {
        ql = this.lookAndFeel.labels.quantityLabel
      }
      return ql
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
    formattedFiat () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      const amount = (paymentChallenge.xchange) ? paymentChallenge.xchange.amountFiat : '0'
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
      })
      const ffiat = formatter.formatToParts(amount) /* $2,500.00 */
      return ffiat[1].value + '.' + ffiat[3].value
    },
    fiatSymbol () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      const fc = (paymentChallenge.xchange) ? paymentChallenge.xchange.fiatCurrency : '???'
      if (fc === 'EUR') {
        return '&euro;'
      } else if (fc === 'GBP') {
        return '&pound;'
      } else {
        return '&dollar;'
      }
    },
    amountFiat () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return (paymentChallenge.xchange) ? paymentChallenge.xchange.amountFiat : '0'
    },
    fiatCurrency () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return (paymentChallenge.xchange) ? paymentChallenge.xchange.fiatCurrency : '???'
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
    }
  }
}
</script>
<style lang="scss">
.fa-small {
  font-size: 15px;
}
.input1 {
  background: #F9B807 0% 0% no-repeat padding-box;
  border-radius: 11px;
  border: none;
  opacity: 0.51;
  font-weight: 700;
  color: #000;
  padding: 10px;
  margin-top: 10px;
}
.input2 {
  background: #F5F5F5 0% 0% no-repeat padding-box;
  border-radius: 11px;
  opacity: 0.51;
  padding: 10px;
  border: none;
  margin-top: 10px;
}
.symbol {
  border: 1pt solid #F9B807;
  border-radius: 50%;
  font-size: 10px;
  padding: 5px;
  margin-right: 10px;
}
.stepper {
  height: 49px;
  background: #F5F5F5 0% 0% no-repeat padding-box;
  border-radius: 5px;
  opacity: 1;
  font-size: 14px;
  font-weight: 700;
  color: #000;
  margin-left: 10px;
  padding: 5px 15px;
}
</style>
