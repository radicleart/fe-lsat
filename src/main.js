import Vue from 'vue'
import wrap from '@vue/web-component-wrapper'
import LsatEntry from './LsatEntry'
import BootstrapVue from 'bootstrap-vue'
import './assets/scss/custom.scss'
import Notifications from 'vue-notification'

const CustomElement = wrap(Vue, LsatEntry)
window.customElements.define('lsat-entry', CustomElement)
Vue.use(BootstrapVue)
Vue.use(Notifications)
