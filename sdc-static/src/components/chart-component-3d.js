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

  },
  watch() {
    profileIds() {
      this.updateGraph()
    }
  }
  methods: {
    saveCsv () {
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
      console.log('create graph')
      var dom = document.getElementById("chart-container")
      this.graph = echarts.init(dom)
    },
    updateGraph() {

            fetch ('http://localhost:5000/api/get_profiles?cdi_ids=12391000&cdi_ids=13240401&cdi_ids=14810446&cdi_ids=30784972&cdi_ids=FI35201045008_0L205_H10&dataset=data_from_SDN_2015-09_TS_MedSea_QC_done_v2.nc', {
              mode: 'cors',
              headers: {
                'Content-Type': 'application/json',
              }
            })
            .then(response => {
              const result = response.text()
              console.log('this is actually working', result, JSON.parse(result))
              return result
            })
            .then(data => {
              console.log('fetchted', data)
              const symbolSize = 2.5
              let options = {
                grid3D: {},
                xAxis3D: {
                    type: 'category'
                },
                yAxis3D: {},
                zAxis3D: {},
                dataset: {
                    dimensions: [
                        'Water temperature',
                        'Water body salinity',
                        'Depth',
                        'cdi_id',
                        {name: 'Water temperature', type: 'ordinal'}
                    ],
                    source: data
                },
                series: [
                    {
                        type: 'scatter3D',
                        symbolSize: symbolSize,
                        encode: {
                            x: 'cdi_id',
                            y: 'Water temperature',
                            z: 'Depth',
                            tooltip: [0, 1, 2, 3, 4]
                        }
                    }
                ]
            };
            this.graph.setOption(options)
            // this.graph.setOption(this.option, true)
          })

    }
  }
}
