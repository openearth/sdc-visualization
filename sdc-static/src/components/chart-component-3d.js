import store from '@/store.js'

import echarts from 'echarts/lib/echarts'
import echartsgl from 'echarts-gl'

import Vue from 'vue'
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
    dataset: {
      type: Array
    },
    type: {
      type: String
    },
    profileIds: {
      type: Array
    }
  },

  mounted() {
    this.createGraph()
    this.updateGraph()

  },
  watch: {
    profileIds: {
      handler() {
        this.updateGraph()
      }
    }
  },
  methods: {
    saveCsv() {
      console.log('yes')
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
      var dom = document.getElementById("chart-3d-container")
      this.graph = echarts.init(dom)
    },
    updateGraph() {
      const ids = this.profileIds.join('&cdi_ids=')

      fetch(`${store.state.serverUrl}/api/get_profiles?cdi_ids=${ids}`, {
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        .then(response => {
          const result = response.json()
          return result
        })
        .then(json => {
          const data = json.data
          let lat = [data[1][4], data[1][4]]
          let lon = [data[1][5], data[1][5]]

          data.forEach((row, i) => {
            if (i === 0) {
            } else {
              row[2] = 0 - row[2]
              if (row[4] > lat[1]) {
                lat[1] = row[4]
              }
              if (row[4] < lat[0]) {
                lat[0] = row[4]
              }
              if (row[5] > lon[1]) {
                lon[1] = row[5]
              }
              if (row[5] < lon[0]) {
                lon[0] = row[5]
              }
            }
          })
          const symbolSize = 2.5
          let options = {
            title: {
              text: 'Water temperature',
              left: 'center',
          },
            grid3D: {},
            xAxis3D: {
              name: 'Latitude',
              min: lat[0],
              max: lat[1]
            },
            yAxis3D: {
              name: 'Longitude',
              min: lon[0],
              max: lon[1]
            },
            zAxis3D: {
              name: 'Depth',
            },
            visualMap: [{
              dimension: 0,
              max: 20,
              min: 10,
              inRange: {
                color: ['#1710c0', '#0b9df0', '#00fea8', '#00ff0d', '#f5f811', '#f09a09', '#fe0300']
              },
              textStyle: {
                color: '#000'
              },
            }],
            dataset: {
              source: data
            },
            series: [{
              name: 'scattersdc',
              type: 'scatter3D',
              symbolSize: symbolSize,
              encode: {
                x: 'lat',
                y: 'lon',
                z: 'Depth',
                color: 'Water temperature',
                tooltip: [0, 1, 2, 3, 4]
              }
            }]
          }
          this.graph.clear()
          this.graph.setOption(options)
          // this.graph.setOption(this.option, true)
        })

    }
  }
}
