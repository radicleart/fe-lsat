<template>
  <b-card-text>
    <div>
      <font-awesome-icon width="15px" height="15px" icon="angle-double-down" @click.prevent="countDown" class="fa-small text-info" style="cursor: pointer;"/>
      <input readonly="true" class="mx-3 bg-warning cd-input" @input="updateCredits($event)" id="input-horizontal1" v-model="localCredits" placeholder="$$$"/>
      <font-awesome-icon width="15px" height="15px" icon="angle-double-up" @click.prevent="countUp" class="fa-small  text-info mr-3" style="cursor: pointer;"/>
      <span class="mr-2 rd-text">{{quantityLabel}}</span>
    </div>
  </b-card-text>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'CryptoStepper',
  components: {
  },
  props: ['lookAndFeel'],
  data () {
    return {
      localCredits: 2
    }
  },
  mounted () {
    const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
    this.localCredits = paymentChallenge.xchange.numbCredits
  },
  methods: {
    countDown () {
      if (this.localCredits < 3) {
        return
      }
      if (this.localCredits === 3) {
        this.localCredits--
      } else {
        this.localCredits -= 2
      }
      this.updateCredits()
    },
    countUp () {
      if (this.localCredits >= 20) {
        return
      }
      this.localCredits += 2
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
    }
  }
}
</script>
<style lang="scss">
.fa-small {
  font-size: 15px;
}
</style>
