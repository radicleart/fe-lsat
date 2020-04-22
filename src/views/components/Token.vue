<template>
  <div class="home" v-if="product">
    <p><img width="50px" :src="product.data.productimage.url" alt="image"/></p>
    <h4>{{product.assetHash}}</h4>
    <div class="d-flex justify-content-between">
      <h6>{{product.purchaseDate}}</h6>
      <h6>£ {{product.amountBtc}}</h6>
    </div>
    <div class="d-flex justify-content-center">
      <h6><b-button class="bg-danger" @click="$emit('openPlaceOrder', product)">Buy Now</b-button></h6>
    </div>
    <p>{{product.data.summary[0].text}}</p>
    <p>{{product.data.description[0].text}}</p>
    <p>{{response}}</p>
  </div>
</template>

<script>
// @ is an alias to /src

export default {
  name: 'Token',
  props: ['product'],
  components: {
  },
  data () {
    return {
      response: null
    }
  },
  methods: {
  }
}
</script>
<style lang="scss">
@import "@/assets/scss/custom.scss";
@import '../../../node_modules/bootstrap/dist/css/bootstrap.min.css';
@import '../../../node_modules/bootstrap-vue/dist/bootstrap-vue.css';

$bg-classroom: #232323;

.classroom {
  background: $orange-bg;
  color: $bg-classroom;
}
</style>
