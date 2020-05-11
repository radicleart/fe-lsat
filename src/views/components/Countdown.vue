<template>
  <div class="mb-3 d-flex justify-content-center">
    <span>{{currentCountdown}}</span>
  </div>
</template>

<script>
import moment from 'moment'

// noinspection JSUnusedGlobalSymbols
export default {
  name: 'Countdown',
  components: {
  },
  props: ['timeout'],
  data () {
    return {
      countdown: null
    }
  },
  mounted () {
    this.startCountdown()
  },
  computed: {
    currentCountdown () {
      if (!this.countdown) {
        var hrs = this.timeout.hours
        var min = this.timeout.minutes
        var sec = this.timeout.seconds
        if (hrs < 10 && hrs.length !== 2) hrs = '0' + hrs
        if (min < 10 && min.length !== 2) min = '0' + min
        if (sec < 10 && sec.length !== 2) sec = '0' + sec
        if (this.timeout.hours > 0) {
          return hrs + ':' + min + ':' + sec
        } else {
          return min + ':' + sec
        }
      } else {
        return this.countdown
      }
    }
  },
  methods: {
    startCountdown () {
      var duration = moment.duration(this.timeout)
      var interval = 1
      const $self = this
      const timer = setInterval(function () {
        duration = moment.duration(duration.asSeconds() - interval, 'seconds')
        var min = duration.minutes()
        var sec = duration.seconds()
        sec -= 1
        if (min < 0) return clearInterval(timer)
        if (min < 10 && min.length !== 2) min = '0' + min
        if (sec < 0 && min !== 0) {
          min -= 1
          sec = 59
        } else if (sec < 10 && sec.length !== 2) {
          sec = '0' + sec
        }
        $self.countdown = min + ':' + sec
        if (min === 0 && sec === 0) {
          $self.$emit('clockReset')
          // $self.timeout.seconds += 2
          duration = moment.duration($self.timeout)
        }
      }, 1000)
    }
  }
}
</script>
<style scoped>
.tab-content {
  padding-top: 0px;
}
</style>
