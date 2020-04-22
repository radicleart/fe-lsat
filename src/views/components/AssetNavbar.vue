<template>
<div class="d-flex justify-content-left">
  <b-nav vertical class="w-100">
    <b-nav-item active @click.prevent="$emit('changeRoute', {to: '/products'})">Products</b-nav-item>
    <b-nav-item active @click.prevent="$emit('changeRoute', {to: '/orders'})">Orders</b-nav-item>
    <b-nav-item active @click.prevent="$emit('changeRoute', {to: '/'})">Home</b-nav-item>
  </b-nav>
</div>
</template>

<script>
import {
  BNav,
  BNavItem
} from 'bootstrap-vue'

export default {
  name: 'AssetNavBar',
  components: {
    BNav, BNavItem
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
