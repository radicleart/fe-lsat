<template>
    <div class="">
      <div class="mb-3 label">{{lookAndFeel.labels.card2Label1}}</div>
      <div class="mt-3 d-flex justify-content-center" style="margin-top: 20px; text-align: center; width: 100%;">
        <span @click.prevent="countDown" class="stepper">
          <font-awesome-icon style="padding: 3px; border-radius: 50%; border: 2pt solid #000;" width="15px" height="15px" icon="minus"/>
        </span>
        <input class="mx-3 input1" @input="updateCredits($event)" id="input-horizontal1" v-model="localCredits" placeholder="$$$"/>
        <span @click.prevent="countUp" class="stepper" style="">
          <font-awesome-icon style="margin-top: 3px;padding: 3px; border-radius: 50%; border: 2pt solid #000;" width="15px" height="15px" icon="plus"/>
        </span>
      </div>
      <waiting-view v-if="loading"/>
      <div v-else>
        <p class="total">Your total</p>
        <div style="margin-bottom: 20px;margin-top: 20px;">
          <span class="symbol" v-html="currentSymbol"></span> <span style="font-weight: 300; margin-left: 20px;">{{currentAmount}}</span>
        </div>
        <div>
          <span class="symbol" v-html="fiatSymbol"></span> <span  style="font-weight: 300; margin-left: 20px;">{{formattedFiat}}</span>
        </div>
      </div>
    </div>
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
<style scoped lang="scss">
.label {
  text-align: left;
  font-weight: 400;
  font-size: 10px;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
}
p.total {
  text-align: left;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
  margin-bottom: 10px;
}
.fa-small {
  font-size: 15px;
}
.input1 {
  width: 48px;
  height: 45px;
  text-align: center;
  background: #FFFFFF 0% 0% no-repeat padding-box;
  box-shadow: 0px 3px 6px #00000029;
  border-radius: 5px;
  border: none;
  opacity: 1;
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
  width: 13px;
  height: 13px;
  color: #000000;
  opacity: 1;
}
.stepper {
  width: 20px;
  height: 20px;
  padding: 5px;
  cursor: pointer;
  margin-left: 15px;
  margin-right: 15px;
  position: relative;
  top: 7px;
}
</style>
