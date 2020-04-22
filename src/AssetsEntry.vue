<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-2">
        <asset-navbar @changeRoute="changeRoute"/>
      </div>
      <div class="col-10 p-0">
        <products v-if="route === 'products'" @openOrder="openOrder"/>
        <orders v-if="route === 'orders'" @openOrder="openOrder"/>
        <product :lsatProductId="lsatProduct.productId" v-else-if="route === 'product'"  @cancel="route = 'products'"  @storedPreimage="route = 'orders'"/>
        <router-view/>
      </div>
    </div>
    <notifications position="top right" width="30%" />
  </div>
</template>
<script>
import Vue from 'vue'
import router from './router'
import store from './store'
import PrismicVue from 'prismic-vue'
import linkResolver from './prismic/linkResolver'
import Notifications from 'vue-notification'
import AssetNavbar from './views/components/AssetNavbar'
import Products from './views/Products'
import Orders from './views/Orders'
import Product from './views/Product'
import BootstrapVue from 'bootstrap-vue'

import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import '../node_modules/bootstrap-vue/dist/bootstrap-vue.css'
// import '@/assets/scss/custom.scss'

Vue.use(BootstrapVue)

Vue.config.productionTip = false
Vue.use(PrismicVue, {
  endpoint: 'https://radsoc.prismic.io/api/v2',
  linkResolver
})
Vue.use(Notifications, { closeOnClick: true, duration: 6000 })

Vue.mixin({ router, store })
// router()
// initRouter()
export default {
  name: 'AssetsEntry',
  components: {
    AssetNavbar,
    Products,
    Product,
    Orders
  },
  props: {
    routeName: {
      type: String,
      default: () => ('products'),
      required: true
    }
  },
  data () {
    return {
      route: 'products',
      productId: null
    }
  },
  watch: {
    '$route' (to, from) {
      this.route = 'orders'
    }
  },
  mounted () {
    this.$store.commit('addTempUserId')
    this.$prismic.client.query(
      this.$prismic.Predicates.at('document.type', 'prod')
    ).then((response) => {
      this.$store.commit('contentStore/addProducts', response.results)
    })
    this.$prismic.client.getByUID('page', 'products').then(document => {
      if (document) {
        this.$store.commit('contentStore/addProductPage', document.data)
      }
    })
  },
  methods: {
    changeRoute: function (data) {
      // this.$router.push(data.to)
      if (data && data.to === '/orders') {
        this.route = 'orders'
      } else if (data && data.to === '/products') {
        this.route = 'products'
      } else {
        this.$emit('changeRoute', data)
      }
    },
    openOrder: function (lsatProduct) {
      this.route = 'product'
      this.productId = lsatProduct.productId
    }
  },
  computed: {
    lsatProduct () {
      const products = this.$store.getters['contentStore/getProducts']
      let lsatProduct = JSON.parse(localStorage.getItem('402-' + products[0].id))
      if (this.productId) {
        lsatProduct = JSON.parse(localStorage.getItem('402-' + products[0].id))
      }
      return lsatProduct
    }
  }
}
</script>
<style lang="scss">
@import "@/assets/scss/custom.scss";

$bg-classroom: #fff;

.classroom {
  background: $white-bg;
  color: $bg-classroom;
}
</style>
