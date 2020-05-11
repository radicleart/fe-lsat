<template>
<div class="container" v-if="product">
  <div class="d-flex justify-content-center">
      <h2>Valid LSAT Token</h2>
      <h2>{{product.assetHash}}</h2>
  </div>
  <div class="d-flex justify-content-center" v-if="productOrder">
  </div>
</div>
</template>

<script>
export default {
  name: 'Token',
  components: {
  },
  props: ['token', 'product'],
  data () {
    return {
    }
  },
  mounted () {
    this.productId = this.$route.params.productId
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
