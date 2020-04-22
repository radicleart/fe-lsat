import Vue from 'vue'
import wrap from '@vue/web-component-wrapper'
import AssetsEntry from './AssetsEntry'
import BootstrapVue from 'bootstrap-vue'
import './assets/scss/custom.scss'
import Notifications from 'vue-notification'

/**
import PrismicVue from 'prismic-vue'
import linkResolver from './prismic/linkResolver'
import Notifications from 'vue-notification'

Vue.config.productionTip = false

Vue.use(PrismicVue, {
  endpoint: 'https://assets2.prismic.io/api/v2',
  linkResolver
})
Vue.use(Notifications, { closeOnClick: true, duration: 6000 })
**/

const CustomElement = wrap(Vue, AssetsEntry)
window.customElements.define('assets-entry', CustomElement)
Vue.use(BootstrapVue)
Vue.use(Notifications)

/*
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
*/
