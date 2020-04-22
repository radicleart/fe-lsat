<template>
  <div class="about">
    <h1>Display an asset ({{ assetId }}) here today</h1>
    <h2>Go on - why not?</h2>
  </div>
</template>
<script>
export default {
  components: {
  },
  name: 'DisplayAsset',
  data () {
    return {
      assetId: null
    }
  },
  mounted () {
    this.assetId = Number(this.$route.params.azzetId)
  },
  methods: {
  }
}
</script>

<style>
</style>
