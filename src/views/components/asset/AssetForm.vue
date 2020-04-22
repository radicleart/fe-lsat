<template>
  <div>
    <b-form class="needs-validation form-transparent" novalidate @submit="checkForm" id="itemForm">
    <div>
      <b-button v-b-toggle.collapse-1 variant="primary">Main Asset Details</b-button>
      <b-collapse id="collapse-1" class="mt-2">
        <b-card>
          <p class="card-text">Collapse contents Here</p>
          <div class="d-flex justify-content-center my-3" >
            <b-input-group>
              <b-form-input v-model="asset.title" placeholder="i name this asset..."></b-form-input>
            </b-input-group>
          </div>
          <div class="d-flex justify-content-center my-3" >
              <b-input-group>
                <b-form-textarea
                  v-model="asset.summary"
                  placeholder="Summary..."
                  rows="3"
                  max-rows="6"
                ></b-form-textarea>
              </b-input-group>
          </div>
          <div class="d-flex justify-content-center my-3" >
              <b-input-group>
                <b-form-textarea
                  v-model="asset.description"
                  placeholder="description..."
                  rows="3"
                  max-rows="6"
                ></b-form-textarea>
              </b-input-group>
          </div>
          <b-button v-b-toggle.collapse-1-inner size="sm">Toggle Inner Collapse</b-button>
          <b-collapse id="collapse-1-inner" class="mt-2">
            <b-card>Hello!</b-card>
          </b-collapse>
        </b-card>
      </b-collapse>
    </div>
    <div class="d-flex justify-content-center my-3" >
      <asset-media class="mb-3" :contentModel="contentModel1" popoverId="'popover-target-1'" :parentalError="parentalError" :showFiles="true" :mediaFiles="mediaFiles1" :limit="1" :sizeLimit="2000000" :mediaTypes="'image,video'" @updateMedia="setByEventLogo1($event)"/>
    </div>
    </b-form>
  </div>
</template>
<script>
import AssetMedia from './AssetMedia'
import moment from 'moment'

export default {
  components: {
    AssetMedia
  },
  name: 'AssetForm',
  props: ['mode'],
  data () {
    return {
      loaded: false,
      validated: false,
      titleValidation: false,
      errors: [],
      contentModel1: {
        title: 'Asset Media',
        errorMessage: 'Asset media is required.',
        popoverBody: 'Digital image or a high res image of your item.<br/><br/>A single hi-res image up to 2M.'
      },
      asset: {
        title: null,
        summary: null,
        description: null
      },
      content: null,
      parentalError: null
    }
  },
  mounted () {
    const $self = this
    this.$prismic.client.getSingle('section-1').then(document => {
      if (document) {
        $self.$store.commit('contentStore/mainContent', document.data)
        $self.content = document.data
      }
      $self.loaded = true
    })
    this.$prismic.client.getSingle('help-list').then(document => {
      if (document) {
        this.$store.commit('contentStore/helpList', document.data)
        this.aboutContent = this.$store.state.contentStore.content['help-list']
        const topicIds = this.getTopicIds(document)
        const slug = topicIds.slug
        const $self = this
        this.$prismic.client.getByIDs(topicIds).then(function (response) {
          $self.setAnswers($self, response, topicIds, slug)
          $self.setAnswer(slug)
        })
      }
    })
  },
  methods: {
    setByEventLogo1 (data) {
      const mediaObjects = data.media
      if (mediaObjects && mediaObjects.length > 0 && mediaObjects[0].type.indexOf('video') > -1) {
        this.asset.media = new Array(data.coverImage)
        this.asset.media.push(mediaObjects[0])
      } else {
        this.asset.media = mediaObjects
      }
    },
    checkForm (event) {
      if (event) {
        event.preventDefault()
        event.target.classList.add('was-validated')
      }
      this.validated = true
      this.asset.privacy = this.privacy
      this.parentalError = null

      this.errors = []
      if (!this.asset.title) {
        this.errors.push('title required.')
      }
      if (!this.asset.description) {
        this.errors.push('description required.')
      }
      if (!this.asset.itemType) {
        this.errors.push('item type required.')
      }
      if (!this.asset.keywords || this.asset.keywords.length < 1) {
        this.errors.push('keywords required.')
      }
      const fullCategory = this.$store.getters['contentStore/getCategory'](this.category.value)
      this.asset.category = fullCategory
      if (!this.asset.category || !this.asset.category.id) {
        this.errors.push('Category required.')
      }

      if (!this.asset.artist || this.asset.artist.indexOf('.id') === -1) {
        this.errors.push('Blockstack id of the artist is missing.')
      }
      if (!this.asset.owner || this.asset.owner.indexOf('.id') === -1) {
        this.errors.push('Blockstack id of the owner is missing.')
      }
      if (!this.asset.medium) {
        this.errors.push('Medium is missing.')
      }
      if (this.asset.artwork && this.asset.artwork.length === 0) {
        this.parentalError = 'Please attach your artwork / digital content.'
        this.errors.push(this.parentalError)
      }

      if (this.created) {
        this.asset.created = moment(this.created).valueOf()
      }
      this.dateError = false
      // if (moment(this.created).isAfter(moment({}))) {
      //  this.dateError = true
      //  this.errors.push('Created date is after now?')
      // }
      if (
        this.asset.itemType === 'physart' &&
        this.asset.supportingDocuments &&
        this.asset.supportingDocuments.length === 0
      ) {
        this.errors.push('Please attach an item.')
      }
      if (this.errors.length > 0) {
        return false
      } else {
        this.uploading = 'uploading'
        if (this.mode === 'update') {
          this.update()
        } else {
          this.upload()
        }
      }
    }
  },
  computed: {
    mediaFiles1 () {
      let files = []
      if (this.asset.media && this.asset.media.length > 0) {
        files = this.asset.media
      }
      return files
    }
  }
}
</script>

<style>
</style>
