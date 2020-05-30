<template>
<div>
  <svg :viewBox="viewBox">
    <path id="inf" :d="path"></path>
    <use xlink:href="#inf" :stroke-dasharray="dasharray" :stroke-dashoffset="dashoffset"></use>
  </svg>
  <div class="mt-5">{{message}}</div>
</div>
</template>

<script>
/**
<svg data-v-031516c0="" viewBox="-2000 -1000 4000 2000">
<path data-v-031516c0="" id="inf" d="M354-354A500 500 0 1 1 354 354L-354-354A500 500 0 1 0-354 354z"></path>
<use data-v-031516c0="" xlink:href="#inf" stroke-dasharray="NaN" stroke-dashoffset="6713px"></use>
</svg>
**/

// noinspection JSUnusedGlobalSymbols
export default {
  name: 'LoopbombSpinner',
  components: {
  },
  props: ['message'],
  data() {
    return {
      r: 500
    }
  },
  mounted() {
  },
  computed: {
    viewBox() {
      let w = 8*this.r
      let h = .5*w
      let x = -.5*w
      let y = -.5*h
      return x + ' ' + y + ' ' + w + ' ' + h
    },
    path() {
      let c = Math.round(this.r/Math.SQRT2)
      let r = this.r
      return 'M' + c + -c + 'A' + r + ' ' + r + ' 0 1 1 ' + c + ' ' + c + 'L' + -c + -c + 'A' + r + ' ' + r + ' 0 1 0' + -c + ' ' + c + 'z'
    },
    dasharray() {
      let d = ~~(Math.PI*this.r)
      let l = Math.ceil((3*Math.PI + 4)*this.r)
      return d + ' ' + (l - d)
    },
    dashoffset() {
      let l = Math.ceil((3*Math.PI + 4)*this.r)
      return l + 'px'
    },
  },
  methods: {
  }
}
</script>
<style>
html { background: #333 }
body { text-align: center }

svg {
  max-width: 25em;
  min-width: 15em;
	border-radius: 3px;
	/* box-shadow: 2px 2px 5px #111; */
	background: #212121;
	fill: none;
	stroke: #111;
	stroke-linecap: round;
	stroke-width: 8%
}

use {
	stroke: #fff;
	animation: a 2s linear infinite
}

@keyframes a { to { stroke-dashoffset: 0px } }</style>
