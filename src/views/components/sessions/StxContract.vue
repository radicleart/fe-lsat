<template>
<div class="vld-parent mt-5 d-flex flex-column align-items-center" v-if="loading">
    <loading :active.sync="loading"></loading>
  <div class="mt-4 d-flex flex-column align-items-center" v-html="waitingMessage">
  </div>
</div>
<div v-else>
  <h3>Loopbomb Stacks Contract</h3>
  <div>Base Token URI: {{baseTokenURI}}</div>
  <div>Mint Price: {{mintPrice}}</div>
  <div>
    <b-input-group prepend="Base Token URL" class="bg-info mt-3">
      <b-form-input v-model="baseTokenURI"></b-form-input>
      <b-input-group-append>
        <b-button variant="info" @click="setBaseTokenURI">Send</b-button>
      </b-input-group-append>
    </b-input-group>
  </div>
  <div class="mt-4">
    <b-input-group prepend="Minting Fee" class="">
      <b-form-input v-model="mintPrice"></b-form-input>
      <b-input-group-append>
        <b-button variant="info" @click="setMintPrice">Send</b-button>
      </b-input-group-append>
    </b-input-group>
  </div>
  <div class="mt-4">
    <b-input-group prepend="Withdraw" class="">
      <b-input-group-append>
        <b-button variant="info" @click="makeWithdrawal">Send</b-button>
      </b-input-group-append>
    </b-input-group>
  </div>

  <div class="mt-4 d-flex flex-column align-items-center"><a href="https://testnet-explorer.blockstack.org/txid/STGPPTWJEZ2YAA7XMPVZ7EGKH0WX9F2DBNHTG5EY.loopbomb" target="_blank">view on explorer</a></div>
  <div class="mt-4 d-flex flex-column align-items-center" v-html="resultMessage"></div>
</div>
</template>

<script>
import Loading from 'vue-loading-overlay'
import {
  uintCV
} from '@blockstack/stacks-transactions'

export default {
  name: 'StxContract',
  components: {
    Loading
  },
  data () {
    return {
      loading: true,
      waitingMessage: 'Loading Contract Administration',
      resultMessage: null,
      mintPrice: 0,
      withdrawal: 0,
      baseTokenURI: null
    }
  },
  mounted () {
    this.$store.dispatch('stacksStore/callContractRisidioReadOnly', { functionName: 'get-base-token-uri' }).then((data) => {
      this.loading = false
      this.baseTokenURI = data.result
    }).catch((e) => {
      this.loading = false
      this.resultMessage = e.message
    })
    this.$store.dispatch('stacksStore/callContractRisidioReadOnly', { functionName: 'get-mint-price' }).then((data) => {
      this.loading = false
      this.mintPrice = data.result
    }).catch((e) => {
      this.loading = false
      this.resultMessage = e.message
    })
    /**
    this.$store.dispatch('stacksStore/callContractBlockstackReadOnly', config).then((result) => {
      this.loading = false
      this.baseTokenURI = result.baseTokenURI
      this.mintPrice = result.mintPrice
    }).catch((e) => {
      this.loading = false
      this.resultMessage = e.message
    })
    config = { opcode: 'stx-get-contract-data', functionName: 'get-mint-price' }
    this.$store.dispatch('stacksStore/callContractRisidioReadOnly', config).then((result) => {
      this.loading = false
      this.baseTokenURI = result.baseTokenURI
      this.mintPrice = result.mintPrice
    }).catch((e) => {
      this.loading = false
      this.resultMessage = e.message
    })
    **/
  },
  methods: {
    onSubmit (evt) {
      evt.preventDefault()
      alert(JSON.stringify(this.form))
    },
    setBaseTokenURI: function (configuration) {
      // NB the config contains a paymentId which can be null for free sessions - status = 9 !
      const config = { opcode: 'eth-set-base-token-uri', baseTokenURI: this.baseTokenURI }
      this.waitingMessage = 'Setting base token url on your contract - takes a minute or so..'
      this.loading = true
      this.$store.dispatch('stacksStore/callContractRisidio', config).then((result) => {
        this.loading = false
        this.resultMessage = 'result'
      }).catch((e) => {
        this.loading = false
        this.resultMessage = e.message
      })
    },
    makeWithdrawal: function (configuration) {
      // NB the config contains a paymentId which can be null for free sessions - status = 9 !
      const config = { opcode: 'eth-make-withdrawal' }
      this.waitingMessage = 'Making a withdrawal - takes a minute or so..'
      this.loading = true
      this.$store.dispatch('stacksStore/callContractRisidio', config).then((result) => {
        this.loading = false
        this.resultMessage = 'result'
      }).catch((e) => {
        this.loading = false
        this.resultMessage = e.message
      })
    },
    setMintPrice: function (configuration) {
      // NB the config contains a paymentId which can be null for free sessions - status = 9 !
      if (this.mintPrice > 100) {
        this.resultMessage = 'Please enter amount up to 100 stx ~ £20 GBP'
        return
      }
      const precision = 1000000
      const amountMicroStax = Math.round(this.mintPrice * precision * precision) / precision
      const functionArgs = [uintCV(amountMicroStax)]
      const config = { functionName: 'update-mint-price', functionArgs: functionArgs }

      this.waitingMessage = 'Setting minting fee on your contract - takes a minute or so..'
      this.loading = true
      this.$store.dispatch('stacksStore/callContractRisidio', config).then((result) => {
        this.loading = false
        this.resultMessage = result
      }).catch((e) => {
        this.loading = false
        this.resultMessage = e.message
      })
    }
  },
  computed: {
  }
}
</script>
<style lang="scss">
.card {
  background-color: #3384f2 !important;
}
.input-group-text {
  background-color: #3384f2;
  color: #212121;
  min-width: 150px;
}
</style>
