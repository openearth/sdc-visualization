import $ from 'jquery';
import Vue from 'vue';
import moment from 'moment';
import ionRangeslider from 'ion-rangeslider/js/ion.rangeSlider.js';


const FORMATS = [
  {
    interval: "years",
    format: "Y-MM-DD"
  },
  {
    interval: "months",
    format: "Y-MM"
  },
  {
    interval: "days",
    format: "Y-MM-DD"
  }
]

const day_format = "Y"
export default {
  name: "time-slider",
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
    // maximum extent, by default 10 * interval
    extent: {
      type: Array,
      default () {
        let now = moment()
        let then = moment().subtract(10, this.interval);
        return [then, now]
      }
    },

  },
  data() {
    return {
      configDialog: false,
      startDateMenu: false,
      endDateMenu: false,
      format: day_format,

      // by default use the full extent
      startDate: this.extent[0].format(day_format),
      endDate: this.extent[1].format(day_format),
      to: this.extent[1].format(day_format),
      from: this.extent[1].subtract(1, this.interval).format(day_format),

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
    console.log(this.startDate, this.endDate, day_format)
    Vue.nextTick(() => {
      let input = this.$el.querySelector("input.slider");
      $(input).ionRangeSlider({
        type: "double",
        drag_interval: true,
        min: +moment(this.startDate).format("X"),
        max: +moment(this.endDate).format("X"),
        from: +moment(this.from).format("X"),
        to: +moment(this.to).format("X"),
        step: +moment.duration(1, this.interval).asSeconds(),
        min_interval: this.fixedHandles ? +moment.duration(1, this.interval).asSeconds() : null,
        max_interval: this.fixedHandles ? +moment.duration(1, this.interval).asSeconds() : null,

        grid: false,
        hide_min_max: true,
        onUpdate: (val) => {
          console.log('onUpdate', val)
          this.$emit('time-extent-update', val)
        },
        onChange: (val) => {
          console.log('onChange', val)
          this.$emit('time-extent-update', val)
        },
        prettify: function (num) {
          return moment(num, "X").format(day_format);
        }
      });
      this.slider = $(input).data("ionRangeSlider");
      this.step()
    })
  },
  watch: {
    extent(val) {
      if (this.slider.dragging) {
        return;
      }
    }

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
      this.from = moment(this.from).add(1, this.interval).format(day_format)
      this.to = moment(this.to).add(1, this.interval).format(day_format)
      // TODO: google earth uses a smarter loop,
      // it keeps track of the diff somehow
      // we reached the end, loop
      if (this.to > moment(this.endDate).format(day_format)) {
        if (this.loop) {
          this.to = moment(this.startDate).add(1, this.interval).format(day_format)
          this.from =  moment(this.startDate).format(day_format)
        } else {
          // stop updating
          return;
        }
      }
      // apply it to the slider (fires update event)
      this.slider.update({"to": +moment(this.to).format("X"), "from": +moment(this.from).format("X")})
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
      return this.dateByFraction(fraction).format(day_format)
    },
    allowedDates() {
      // return allowed dates, based on extent
      return {
        min: this.extent[0].format(day_format),
        max: this.extent[1].format(day_format)
      }
    }
  },
  computed: {
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
