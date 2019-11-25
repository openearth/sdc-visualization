import $ from 'jquery';
import Vue from 'vue';
import moment from 'moment';
import ionRangeslider from 'ion-rangeslider/js/ion.rangeSlider.js';
import TimeSliderSettings from './TimeSliderSettings.vue'
import {FORMATS} from './time-formats'

export default {
  name: "time-slider",
  components: {
    TimeSliderSettings
  },
  props: {
    showPlay: {
      type: Boolean,
      default: true
    },
    interval: {
      type: String,
      default: "years"
    },
    fixedHandles: {
      type: Boolean,
      default: false
    },
    // Current extent  of  time slider
    extent: {
      type: Array,
      required: true
    },
    // Maximum extent
    domain: {
      type: Array,
      default () {
        // by default us the extent on creation
        return [...this.extent]
      }
    },
    // Current selected timespan
    // By  default last year
    range: {
      type: Array,
      default () {
        let to = this.extent[1]
        let from = this.extent[1].subtract(1, this.interval)
        return [from, to]
      }
    }
  },
  data() {

    return {
      showSettings: false,
      format: FORMATS.year,

      // duration of a loop
      loopDuration: 20,
      maxFps: 10,
      // last timestep (for syncing rate)
      last: null,
      loop: true,
      state: 'paused',
      slider: null
    };
  },
  mounted() {
    Vue.nextTick(() => {
      let input = this.$el.querySelector("input.slider");
      $(input).ionRangeSlider({
        type: "double",
        drag_interval: true,
        min: +moment(this.startDate).format("X"),
        max: +moment(this.endDate).format("X"),
        from: +moment(this.range[0]).format("X"),
        to: +moment(this.range[1]).format("X"),
        step: +moment.duration(1, this.interval).asSeconds(),
        min_interval: this.fixedHandles ? +moment.duration(1, this.interval).asSeconds() : null,
        max_interval: this.fixedHandles ? +moment.duration(1, this.interval).asSeconds() : null,

        grid: false,
        hide_min_max: true,
        onUpdate: (val) => {
          let range = [moment.unix(val.from), moment.unix(val.to)]
          this.$emit('update:range', range)
        },
        onChange: (val) => {
          let range = [moment.unix(val.from), moment.unix(val.to)]
          this.$emit('update:range', range)
        },
        prettify: function (num) {
          return moment(num, "X").format(FORMATS.year);
        }
      });
      this.slider = $(input).data("ionRangeSlider");
      this.step()
    })
  },
  methods: {
    pause() {
      this.state = 'paused';
    },
    play() {
      this.last = performance.now();
      this.state = 'playing';
    },
    step(now) {
      // request the next step (yes you can call this function now, does not matter)
      requestAnimationFrame(this.step)
      // first update, when this.last is still null, set value and return
      if (!this.last) {
        this.last = now;
        return
      }
      // now we can just return if we are not playing (will result in a regular poll for playing)
      if (this.state !== 'playing') {
        return;
      }
      // elapsed time in seconds
      const elapsed = (now - this.last)/3000;
      // seconds per frame did not elapse, we're done
      if (elapsed < (1/this.maxFps)) {
        // this keeps the number of events low (otherwise you get 60 events per second)
        return;
      }
      // update with fraction
      let from = moment(this.range[0]).add(1, this.interval).format(FORMATS.year)
      let to = moment(this.range[1]).add(1, this.interval).format(FORMATS.year)
      // TODO: google earth uses a smarter loop,
      // it keeps track of the diff somehow
      // we reached the end, loop
      if (to > moment(this.endDate).format(FORMATS.year)) {
        if (this.loop) {
          to = moment(this.startDate).add(1, this.interval).format(FORMATS.year)
          from = moment(this.startDate).format(FORMATS.year)
        } else {
          // stop updating
          return;
        }
      }
      // apply it to the slider (fires update event)
      this.slider.update({"to": +moment(to).format("X"), "from": +moment(from).format("X")})
      // remember current time
      this.last = now;
    },
    dateByFraction (fraction) {
      // miliseconds diff
      const start = moment(this.startDate)
      const end = moment(this.endDate)
      // positive number of miliseconds
      const diff = end.diff(start)
      const time = start.clone().add(diff * fraction, 'ms')
      return time
    },
    dateFormat (fraction) {
      return this.dateByFraction(fraction).format(FORMATS.year)
    }
  },
  computed: {
    startDate: {
      get () {
        let start = this.extent[0]
        return start.format(FORMATS.day)
      },
      set (val) {
        let extent = [...this.extent]
        extent[0] = moment(val)
        this.$emit('update:extent', extent)
      }
    },
    endDate: {
      get () {
        return this.extent[1].format(FORMATS.day)
      },
      set (val) {
        let extent = [...this.extent]
        extent[1] = moment(val)
        this.$emit('update:extent', extent)
      }
    },
    currentTime() {
      return this.dateByFraction(this.slider.result.to);
    },
    currentExtent() {
      return [
        this.dateByFraction(this.slider.result.from),
        this.dateByFraction(this.slider.result.to)
      ];
    }
  }
}
