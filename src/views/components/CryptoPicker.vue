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
export default {
  name: 'CryptoPicker',
  components: {
  },
  props: ['paymentOption'],
  data () {
    return {
      selected: null,
      options: [
        { text: 'Lightning', value: 'lightning' },
        { text: 'Bitcoin', value: 'bitcoin' },
        { text: 'Ether', value: 'ethereum' },
        { text: 'Stacks', value: 'stacks' }
      ]
    }
  },
  mounted () {
    this.selected = this.paymentOption
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
