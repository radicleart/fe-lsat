import Vue from 'vue'
import VueRouter from 'vue-router'
import Products from '../views/Products'
import Product from '../views/Product'

// let initialized = false
Vue.use(VueRouter)

const routes = [
  {
    path: '/products',
    name: 'products',
    components: { default: Products }
  },
  {
    path: '/product/:productId',
    name: 'product',
    components: { default: Product }
  }
]

const router = new VueRouter({
  base: process.env.BASE_URL,
  routes
})

export default router

/**
import Vue from 'vue'
import VueRouter from 'vue-router'
import Assets from '../views/Assets'
import CreateAsset from '../views/CreateAsset'
import DisplayAsset from '../views/DisplayAsset'

Vue.use(VueRouter)

const routes = [
  {
    path: '/silent',
    name: 'silent',
    component: Assets
  },
  {
    path: '/assets',
    name: 'assets',
    meta: { requiresAuth: true },
    components: { default: Assets },
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
**/
