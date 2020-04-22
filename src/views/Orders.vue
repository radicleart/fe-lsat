<template>
<div class="" v-if="productPage">
  <div v-if="products">
    <div>
      <h1>{{productPage.title[0].text}}</h1>
    </div>
    <div v-if="products" class="row">
      <div class="col-12" v-for="(product, index) of products" :key="index">
        <table class="mb-4 p-5" style="width: 90%; border-radius: 15px">
          <tr class="">
            <th class="classroom pt-2">Product Id</th>
            <td class="classroom pt-2">{{product.id}}</td>
          </tr>
          <tr>
            <th class="classroom pt-2">Name</th>
            <td class="classroom pt-2">{{product.data.title[0].text}}</td>
          </tr>
          <tr>
            <th class="classroom pt-2">Amount</th>
            <td class="classroom pt-2"><span>{{lsatProduct(product).lsat.invoiceAmount}} / {{lsatProduct(product).amount}}</span></td>
          </tr>
          <tr>
            <th class="classroom pt-2"><a href="#" @click.prevent="expired(product)">Token</a></th>
            <td class="classroom pt-2"><span>{{token(product)}}</span></td>
          </tr>
          <tr>
            <th class="classroom pt-2"><a href="#" @click.prevent="expired(product)">Created</a></th>
            <td class="classroom pt-2"><span>{{timeCreated(product)}}</span></td>
          </tr>
          <tr>
            <th class="classroom pt-2"><a href="#" @click.prevent="expired(product)">Expires</a></th>
            <td class="classroom pt-2"><span>{{timeExpires(product)}}</span> {{expired(product)}}</td>
          </tr>
          <tr>
            <th class="classroom pt-2">TUser Id</th>
            <td class="classroom pt-2"><span>{{lsatProduct(product).tuid}}</span></td>
          </tr>
          <tr>
            <th class="classroom pt-2">Payment Hash</th>
            <td class="classroom pt-2"><span>{{lsatProduct(product).lsat.paymentHash}}</span></td>
          </tr>
        </table>
      </div>
    </div>
  </div>
  <div v-else>
    waiting for content...
  </div>
</div>
</template>
<script>
import moment from 'moment'

export default {
  name: 'Orders',
  components: {
  },
  data () {
    return {
      purchaseOrder: null
    }
  },
  methods: {
    lsatProduct: function (product) {
      const lsatProduct = JSON.parse(localStorage.getItem('402-' + product.id))
      if (lsatProduct) {
        return lsatProduct
      }
      return {}
    },
    token: function (product) {
      const lsatProduct = JSON.parse(localStorage.getItem('402-' + product.id))
      if (lsatProduct) {
        return lsatProduct.token
      }
      return {}
    },
    timeCreated: function (product) {
      const lsatProduct = JSON.parse(localStorage.getItem('402-' + product.id))
      if (lsatProduct) {
        return moment(lsatProduct.lsat.timeCreated).format('YYYY-MM-DD HH:mm:SS')
      }
      return '?'
    },
    timeExpires: function (product) {
      const lsatProduct = JSON.parse(localStorage.getItem('402-' + product.id))
      if (lsatProduct) {
        return moment(lsatProduct.lsat.timeCreated + 3600000).format('YYYY-MM-DD HH:mm:SS')
      }
      return '?'
    },
    expired: function (product) {
      const lsatProduct = JSON.parse(localStorage.getItem('402-' + product.id))
      return moment() > lsatProduct.lsat.timeCreated + 3600000
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
        return {
          lsat: {}
        }
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

table {

}
.classroom {
  background: $orange-bg;
  color: $bg-classroom;
  padding: 4px 10px;
  margin: 3px 10px;
}
</style>
