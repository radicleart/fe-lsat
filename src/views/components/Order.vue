<template>
  <div class="home" v-if="product">
    <h4>{{product.assetHash}}</h4>
    <div class="d-flex justify-content-between">
      <h6>{{product.purchaseDate}}</h6>
      <h6>£ {{product.amountBtc}}</h6>
    </div>
    <lightning-payment-address v-if="product" :lsat="product.lsat" @cancel="lsat = null"/>
  </div>
</template>

<script>
import LightningPaymentAddress from './payment/LightningPaymentAddress'

export default {
  name: 'Order',
  props: ['product'],
  components: {
    LightningPaymentAddress
  },
  data () {
    return {
      response: null
    }
  },
  methods: {
  },
  computed: {
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
