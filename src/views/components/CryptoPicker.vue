<template>
<b-card-text>
  <!--
  <b-form-group class="text-warning">
    <b-form-radio-group
      v-model="selected"
      :options="options"
      @change="changePayment"
      name="radio"
    ></b-form-radio-group>
  </b-form-group>
  -->
  <b-form-group class="text-warning">
    <b-form-radio v-model="selected" @change="changePayment(option.value)" name="radio" :value="option.value" v-for="(option, index) in options" :key="index">{{option.text}}</b-form-radio>
  </b-form-group>
</b-card-text>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'CryptoPicker',
  components: {
  },
  props: ['paymentOption'],
  data () {
    return {
      selected: null,
      options: null
    }
  },
  watch: {
    'paymentOption' () {
      this.selected = this.paymentOption
    }
  },
  mounted () {
    const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
    this.selected = configuration.paymentOption
    this.options = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_OPTIONS]
  },
  methods: {
    changePayment (value) {
      this.$emit('updatePaymentOption', value)
    }
  },
  computed: {
  }
}
</script>
<style lang="scss">
</style>
