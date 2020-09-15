<template>
<b-card-group>
</b-card-group>
</template>

<script>
const EXPLORER = process.env.VUE_APP_ETHERSCAN

export default {
  name: 'ResultPage',
  components: {
  },
  props: ['result'],
  data () {
    return {
    }
  },
  mounted () {
  },
  methods: {
  },
  computed: {
    etherScanUrl () {
      return EXPLORER + '/tx/' + this.result.txId
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
