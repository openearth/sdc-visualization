import $ from 'jquery';
import Vue from 'vue';
import moment from 'moment';
import ionRangeslider from 'ion-rangeslider/js/ion.rangeSlider.js';

export default {
  name: "time-slider",
  props: {
    // maximum extent, by default 10 * interval
    extent: {
      type: Array,
      default () {
        let min = 0
        let max = 100
        return [min, max]
      }
    },

  },
  data() {
    return {
    };
  },
  mounted() {
    Vue.nextTick(() => {
      let input = this.$el.querySelector("input.d-slider");
      $(input).ionRangeSlider({
        min: this.extent[0],
        max: this.extent[1]
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
  },
  computed: {
  }
}
