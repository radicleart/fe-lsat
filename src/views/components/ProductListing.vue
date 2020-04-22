<template>
  <div class="home">
    <p><img width="40px" :src="product.data.productimage.url" alt="image"/></p>
    <h4>{{product.data.title[0].text}}</h4>
    <h6>{{product.id}}</h6>
    <h6>{{getExpiry}}</h6>
    <h6>{{getNow}}</h6>
    <h6>{{token}}</h6>
    <div class="d-flex justify-content-between">
      <h6>{{product.data.saleends}}</h6>
      <h6>£ {{product.data.amount}}</h6>
    </div>
    <div class="d-flex justify-content-center" v-if="hasToken">
      <h6><b-button class="bg-danger" @click.prevent="$emit('openOrder', product.id)">Shipping Details</b-button></h6>
    </div>
    <div class="d-flex justify-content-center" v-else-if="!isExpired() && hasLsat">
      <h6><b-button class="bg-danger" @click.prevent="$emit('openOrder', product.id)">Valid Invoice - Payment not received</b-button></h6>
    </div>
    <div class="d-flex justify-content-center" v-else-if="isExpired() && hasLsat">
      <h6><b-button class="bg-danger" @click.prevent="$emit('placeOrder', product)">Invoice Expired</b-button></h6>
    </div>
    <div class="d-flex justify-content-center" v-else>
      <h6><b-button class="bg-danger" @click.prevent="$emit('placeOrder', product)">Buy Now</b-button></h6>
    </div>
    <div class="d-flex justify-content-center">
      <h6><router-link :to="'/product/' + product.id">{{routeLabel()}}</router-link></h6>
    </div>
    <p>{{product.data.summary[0].text}}</p>
    <p>{{product.data.description[0].text}}</p>
  </div>
</template>

<script>
import moment from 'moment'

export default {
  name: 'ProductListing',
  props: ['product'],
  components: {
  },
  data () {
    return {
    }
  },
  methods: {
    isExpired () {
      const lsatProduct = JSON.parse(localStorage.getItem('402-' + this.product.id))
      // return lsatProduct.lsat.isPending && moment().valueOf() > lsatProduct.lsat.timeCreated + 3600000
      const now = moment()
      const exp = moment(lsatProduct.lsat.timeCreated + 3600000)
      return exp.isBefore(now)
    },
    routeLabel () {
      const product = JSON.parse(localStorage.getItem('402-' + this.product.id))
      if (!product.lsat) {
        return 'Buy Now'
      }
      if (!product.token && this.isExpired) {
        return 'Invoice has expired'
      }
      if (product.token) {
        return 'Shipping and Collection'
      }
      return 'Unknown State?'
    }
  },
  computed: {
    hasLsat () {
      const lsatProduct = JSON.parse(localStorage.getItem('402-' + this.product.id))
      return lsatProduct
    },
    token () {
      const lsatProduct = JSON.parse(localStorage.getItem('402-' + this.product.id))
      return lsatProduct.token
    },
    hasToken () {
      const lsatProduct = JSON.parse(localStorage.getItem('402-' + this.product.id))
      return (lsatProduct && lsatProduct.token)
    },
    getExpiry () {
      const lsatProduct = JSON.parse(localStorage.getItem('402-' + this.product.id))
      return moment(lsatProduct.lsat.timeCreated + 3600000)
    },
    getNow () {
      return moment()
    }
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
