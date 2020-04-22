<template>
<div class="py-5">
  <div v-for="(item, index) of prismicItems" :key="index">
    <p class="mb-3" v-if="item.type === 'paragraph'" v-html="item.text"></p>
    <h1 class="my-5" v-else-if="item.type === 'heading1'" v-html="item.text"></h1>
    <h2 class="my-5" v-else-if="item.type === 'heading2'" v-html="item.text"></h2>
    <h3 class="my-5" v-else-if="item.type === 'heading3'" v-html="item.text"></h3>
    <h4 class="my-5" v-else-if="item.type === 'heading4'" v-html="item.text"></h4>
    <h4 class="my-5" v-else-if="item.type === 'heading5'" v-html="item.text"></h4>
    <img class="img-responsive my-5" style="max-width: 90%;" v-else-if="item.type === 'image'" :src="item.url"/>
    <div class="ml-5" v-else-if="item.type === 'o-list-item'"><b class="pb-2">-</b> {{item.text}}</div>
  </div>
</div>
</template>

<script>

export default {
  components: {
  },
  props: ['prismicItems'],
  name: 'PrismicItems',
  data () {
    return {
    }
  },
  mounted () {
  },
  computed: {
  },
  methods: {
  }
}
</script>
