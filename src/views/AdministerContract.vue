<template>
<div class="vld-parent mt-5 d-flex flex-column align-items-center" v-if="loading">
    <loading :active.sync="loading"></loading>
  <div class="mt-4 d-flex flex-column align-items-center" v-html="waitingMessage">
  </div>
</div>
<div v-else>
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
  <div class="mt-4 d-flex flex-column align-items-center" v-html="resultMessage"></div>
</div>
</template>

<script>
import Loading from 'vue-loading-overlay'

export default {
  name: 'AdministerContract',
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
    const config = { opcode: 'eth-get-contract-data' }
    this.$store.dispatch('ethereumStore/transact', config).then((result) => {
      this.loading = false
      this.baseTokenURI = result.baseTokenURI
      this.mintPrice = result.mintPrice
    }).catch((e) => {
      this.loading = false
      this.resultMessage = e.message
    })
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
      this.$store.dispatch('ethereumStore/transact', config).then((result) => {
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
      this.$store.dispatch('ethereumStore/transact', config).then((result) => {
        this.loading = false
        this.resultMessage = 'result'
      }).catch((e) => {
        this.loading = false
        this.resultMessage = e.message
      })
    },
    setMintPrice: function (configuration) {
      // NB the config contains a paymentId which can be null for free sessions - status = 9 !
      if (this.mintPrice > 0.05) {
        this.resultMessage = 'Please enter amount in eth - no more than 0.05 ~ £10 GBP'
        return
      }
      const config = { opcode: 'eth-set-minting-fee', mintPrice: this.mintPrice }
      this.waitingMessage = 'Setting minting fee on your contract - takes a minute or so..'
      this.loading = true
      this.$store.dispatch('ethereumStore/transact', config).then((result) => {
        this.loading = false
        this.resultMessage = 'result'
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
