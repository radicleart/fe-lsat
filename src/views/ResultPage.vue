<template>
<b-card-group class="text-warning">
  <b-card header-tag="header" footer-tag="footer">
    <b-card-text class="d-flex justify-content-center" v-if="result.opcode.startsWith('eth-')">
      <p v-html="result.message"></p>
      <p v-if="result.opcode === 'eth-payment-confirmed'"><a :href="etherScanUrl">view transaction on etherscan.</a></p>
    </b-card-text>
  </b-card>
</b-card-group>
</template>

<script>
const EXPLORER = process.env.VUE_APP_ETHERSCAN

export default {
  name: 'ResultPage',
  components: {
  },
  props: ['result'],
  data () {
    return {
    }
  },
  mounted () {
  },
  methods: {
  },
  computed: {
    etherScanUrl () {
      return EXPLORER + '/tx/' + this.result.txId
    }
  }
}
</script>
<style lang="scss">
@import "@/assets/scss/custom.scss";

$bg-classroom: #232323;

.classroom {
  background: $orange-bg;
  color: $bg-classroom;
}
</style>
