<template>
<div class="vld-parent mt-5 d-flex flex-column align-items-center" v-if="loading">
    <loading :active.sync="loading"></loading>
    <div class="mt-4 d-flex flex-column align-items-center" v-html="waitingMessage">
  </div>
</div>
<div v-else>
  <h4>Manage <span v-if="showEthereum">Ethereum</span> <span v-else>Stacks</span>  Contract</h4>
  <p class="text-right"><a href="#" @click.prevent="showEthereum = !showEthereum">Switch to <span v-if="showEthereum">stacks</span> <span v-else>ethereum</span> contract</a></p>
  <eth-contract v-if="showEthereum"/>
  <stx-contract v-else/>
  <div class="mt-4 d-flex flex-column align-items-center" v-html="resultMessage"></div>
  <!--
  <div v-if="paymentOptions">
    <b-form-group label="Using sub-components:">
      <b-form-checkbox-group id="checkbox-group-2" v-model="selected" name="flavour-2">
        <b-form-checkbox value="ethereum"><span :class="(paymentOptions.mainOption === 'ethereum') ? 'text-info' : ''" @click.prevent="setDefault('ethereum')">Ethereum</span></b-form-checkbox>
        <b-form-checkbox value="bitcoin"><span :class="(paymentOptions.mainOption === 'bitcoin') ? 'text-info' : ''" @click.prevent="setDefault('bitcoin')">Bitcoin</span></b-form-checkbox>
        <b-form-checkbox value="lightning"><span :class="(paymentOptions.mainOption === 'lightning') ? 'text-info' : ''" @click.prevent="setDefault('lightning')">Lightning</span></b-form-checkbox>
        <b-form-checkbox value="stacks"><span :class="(paymentOptions.mainOption === 'stacks') ? 'text-info' : ''" @click.prevent="setDefault('stacks')">Stacks</span></b-form-checkbox>
      </b-form-checkbox-group>
    </b-form-group>
    <b-button variant="outline-secondary" @click="setPaymentOptions()">Save</b-button>
  </div>
  -->
</div>
</template>

<script>
import EthContract from './EthContract'
import StxContract from './StxContract'
import Loading from 'vue-loading-overlay'

const KEY_PO = 'getPaymentOptions'

export default {
  name: 'AdministerContract',
  components: {
    Loading,
    StxContract,
    EthContract
  },
  data () {
    return {
      loading: true,
      message: null,
      selected: [],
      resultMessage: null,
      waitingMessage: 'waiting for data from blockchain',
      showEthereum: false
    }
  },
  mounted () {
    this.loading = false
    const paymentOptions = this.$store.getters[KEY_PO]
    if (paymentOptions.allowEthereum) this.selected.push('ethereum')
    if (paymentOptions.allowBitcoin) this.selected.push('bitcoin')
    if (paymentOptions.allowLightning) this.selected.push('lightning')
    if (paymentOptions.allowStacks) this.selected.push('stacks')
  },
  methods: {
    setDefault (mainOption) {
      const paymentOptions = this.$store.getters[KEY_PO]
      if (this.selected.indexOf(mainOption) > -1) {
        paymentOptions.mainOption = mainOption
        // this.$store.dispatch('paymentStore/storeGlobalConfig', { paymentOptions: paymentOptions })
      }
    },
    setPaymentOptions (mainOption) {
      const paymentOptions = this.$store.getters[KEY_PO]
      paymentOptions.allowEthereum = this.selected.indexOf('ethereum') > -1
      paymentOptions.allowBitcoin = this.selected.indexOf('bitcoin') > -1
      paymentOptions.allowLightning = this.selected.indexOf('lightning') > -1
      paymentOptions.allowStacks = this.selected.indexOf('stacks') > -1
      // this.$store.dispatch('paymentStore/storeGlobalConfig', { paymentOptions: paymentOptions })
    }
  },
  computed: {
    paymentOptions () {
      return this.$store.getters[KEY_PO]
    }
  }
}
</script>
<style scoped>
.btn {
  font-size: 1.1rem;
  padding: 4px 10px;
  margin: 2px 3px;
  text-transform: capitalize;
}
</style>
