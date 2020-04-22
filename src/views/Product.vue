<template>
  <div class="home" v-if="lsatProduct">
    <h4>{{lsatProduct.assetHash}}</h4>
    <div class="d-flex justify-content-between">
      <h6>{{lsatProduct.purchaseDate}}</h6>
      <h6>BTC {{amountBTC()}} / £ {{lsatProduct.amount}}</h6>
      <b-button class="bg-info" @click="$emit('cancel')">go back</b-button>
    </div>
    <div class="d-flex flex-column align-items-center" v-if="lsatProduct.token">
      <div class="d-flex justify-content-center">
        Payment recieved with thanks - you can now access you resource...
      </div>
      <div class="d-flex justify-content-center">
        <h6><b-button class="bg-danger" @click="$emit('collectOrder')">Collect Product</b-button></h6>
      </div>
    </div>
    <lightning-payment-address v-else :lsatProduct="lsatProduct" @storedPreimage="storedPreimage"/>
  </div>
</template>

<script>
import LightningPaymentAddress from './components/payment/LightningPaymentAddress'

export default {
  name: 'ProductPage',
  components: {
    LightningPaymentAddress
  },
  props: ['lsatProductId'],
  data () {
    return {
    }
  },
  methods: {
    amountBTC: function () {
      return Math.round(this.lsatProduct.amountBtc * 10000000) / 10000000
    },
    storedPreimage: function (ev) {
      this.$emit(ev)
    }
  },
  computed: {
    lsatProduct () {
      const lsatProduct = JSON.parse(localStorage.getItem('402-' + this.lsatProductId))
      return lsatProduct
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
