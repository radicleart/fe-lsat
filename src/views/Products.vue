<template>
<div class="" v-if="productPage">
  <!-- <lightning-payment-address v-if="lsatProduct" :lsat="lsatProduct.lsat" @cancel="lsat = null"/> -->
  <div v-if="products">
    <div>
      <h1>{{productPage.title[0].text}}</h1>
      <prismic-items :prismicItems="productPage['text']"/>
    </div>
    <div v-if="products" class="row">
      <div class="col-12" v-for="(product, index) of products" :key="index">
        <!-- <product-listing :product="product" @placeOrder="placeOrder" @openOrder="openOrder"/> -->
        <product-listing :product="product"/>
      </div>
    </div>
  </div>
  <div v-else>
    waiting for content...
  </div>
</div>
</template>
<script>
import PrismicItems from './components/PrismicItems'
import ProductListing from './components/ProductListing'
// import LightningPaymentAddress from './components/payment/LightningPaymentAddress'
// import _ from 'lodash'

export default {
  name: 'Products',
  components: {
    PrismicItems,
    ProductListing
  },
  data () {
    return {
      purchaseOrder: null,
      paymentOption: null,
      collections: false,
      lsatProduct: null
    }
  },
  methods: {
    placeOrder: function (product) {
      const amountBtc = product.data.amount / 5498
      const MYKEY = 'getTempUserId' // trick lint!
      const tuid = this.$store.getters[MYKEY]
      const purchaseOrder = {
        assetHash: product.data.title[0].text,
        status: 3,
        productId: product.id,
        purchaseDate: product.data.saleends,
        amount: product.data.amount,
        amountBtc: amountBtc,
        tuid: tuid,
        addressTo: 'unknown',
        addressFrom: 'unknown'
      }
      this.$store.dispatch('placeOrder', purchaseOrder).then((lsatProduct) => {
        this.$emit('openOrder', lsatProduct)
      })
    },
    openOrder: function (productId) {
      const lsatProduct = JSON.parse(localStorage.getItem('402-' + productId))
      if (!lsatProduct.lsat || !lsatProduct.lsat.paymentHash) {
        this.placeOrder(lsatProduct)
      } else {
        // this.$emit('openOrder', lsatProduct)
        this.placeOrder(lsatProduct)
      }
    }
  },
  computed: {
    productPage () {
      return this.$store.getters['contentStore/getProductPage']
    },
    products () {
      const products = this.$store.getters['contentStore/getProducts']
      /**
      const products = []
      _.forEach(prods, function (prod) {
        const lsatProduct = JSON.parse(localStorage.getItem('402-' + prod.id))
        if (lsatProduct) {
          products.push(lsatProduct)
        } else {
          products.push(prod)
        }
      })
      **/
      return products
    },
    productRows () {
      if (!this.purchaseOrder) {
        return {}
      }
      return [
        { label: 'Ref No', value: this.purchaseOrder.productId },
        { label: 'Title', value: this.purchaseOrder.assetHash },
        { label: 'Date', value: this.purchaseOrder.purchaseDate },
        { label: 'TUID', value: this.purchaseOrder.tuid },
        { label: 'Amount', value: this.purchaseOrder.amount },
        { label: 'Amount Btc', value: this.purchaseOrder.amountBtc }
      ]
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
