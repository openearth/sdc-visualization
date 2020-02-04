import echarts from 'echarts/lib/echarts'
import echartsgl from 'echarts-gl'

import Vue from 'vue'
import _ from 'lodash'
import Papa from 'papaparse'

// TODO: replace this with vue-echart
export default {
  name: "chart-component",
  data() {
    return {
      graph: null,
      graphDateRange: null,
      x: null,
      y: null
    }
  },
  props: {
    // xRange: {
    //   type: Array
    // },
    dataset: {
      type: Array
    },
    // options: {
    //   type: Object,
    //   default () {
    //     return {}
    //   }
    // },
    type: {
      type: String
    }
  },
  computed: {
    // variables() {
    //   // get the names
    //   return _.keys(
    //     // get the first record
    //     _.first(
    //       // get data if available
    //       _.get(this.series, 'data')
    //     )
    //   )
    // },
    // xyValues() {
    //   let values = _.zip(this.xValues, this.yValues)
    //   return values
    // },
    // xValues() {
    //   if (_.isNil(this.series)) {
    //     return []
    //   }
    //   if (_.isNil(this.x)) {
    //     return []
    //   }
    //   let data = this.series.data
    //   let x = this.x
    //   let values = _.map(data, x)
    //   return values
    // },
    // yValues() {
    //   if (_.isNil(this.series)) {
    //     return []
    //   }
    //   if (_.isNil(this.y)) {
    //     return []
    //   }
    //   let data = this.series.data
    //   let y = this.y
    //   let values = _.map(data, y)
    //   return values
    // },
    option() {
      let options = {
        grid3D: {},
        visualMap: {
          show: true,
          dimension: 2,
          min: 30,
          max: 40,
          inRange: {
            color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
          }
        },
        xAxis3D: {},
        yAxis3D: {},
        zAxis3D: {},
        dataset: {
          dimensions: [
            'd',
            'T',
            'S',
            'c_id',
            's_id',
            'type',
            'lon',
            'lat',
            't'
          ],
          source: this.dataset
        },
        series: [{
          type: this.type,
          symbolSize: 2,
          encode: {
            x: 'lat',
            y: 'lon',
            z: 'd',
            tooltip: [0, 1, 2, 3, 4, 5, 6, 7, 8]
          }
        }]
      }

      // let options = {
      //     tooltip: {
      //         trigger: 'axis',
      //         axisPointer: {
      //             type: 'cross'
      //         }
      //     },
      //     xAxis: {
      //         // min: _.min(this.xValues),
      //         // max: _.max(this.xValues)
      //     },
      //     yAxis: {
      //         // min: _.min(this.yValues),
      //         // max: _.max(this.yValues),
      //         inverse: this.y === 'Depth'
      //     },
      //     series: [
      //         {
      //             symbolSize: 2,
      //             type: this.type,
      //             data: this.xyValues
      //         }
      //     ]
      // }
      // options = _.merge(options, this.options)
      console.log('options', options)
      return options

    }

  },
  watch: {
    option(option) {
      this.graph.setOption(option)
    }
  },
  mounted() {
    this.createGraph()

  },
  methods: {
    saveCsv() {
      // let csv = Papa.unparse(this.series)
      // let download = document.createElement('a')
      // let encodedUri = encodeURI(csv)
      // let blob = new Blob([csv]);
      // let href = window.URL.createObjectURL(blob, {
      //   type: "text/plain"
      // });
      // console.log('csv', href)
      // download.href = href
      // download.download = 'data.csv'
      // download.click();


    },
    saveImage() {
      let src = this.graph.getDataURL({
        pixelRatio: 2,
        backgroundColor: '#fff'
      })
      let download = document.createElement('a')
      download.href = src
      download.download = 'screenshot.png'
      download.click();
      //  let img = new Image();
      // img.src = src

    },
    createGraph() {
      console.log('create graph')
      var dom = document.getElementById("chart-container")
      this.graph = echarts.init(dom)
      this.graph.setOption(this.option, true)

    }
  }
}
