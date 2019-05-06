import Vue from 'vue';
import echarts from 'echarts'

export default {
  name: "chart-component",
  data () {
    return {
      graph: null,
      graphdaterange: null,
      option: null,
      items: ['Temperature', 'Salinity']
    }
  },
  props: {
    daterange: {
      type: Array
    },
    graphData: {
      type: Object
    }
  },
  watch: {
      graphData: {
          handler: function(graphData) {
              this.option.series[0].data = graphData.data
              this.option.xAxis.data = graphData.time
              this.graph.setOption(this.option)
          }
      },
    // Watch "layers". This is a switch, which can toggle a layer on or off
    // When toggled, this watcher will activate the toggleLayers function.
    daterange: {
      handler: function(daterange) {
        console.log('graphdaterange')
        this.graphdaterange = daterange
        console.log(daterange, parseInt(daterange[0]), daterange[1])
        this.option.series[0].markArea = {
            data: [[{
                xAxis: daterange[0]
            }, {
                xAxis: daterange[1]
            }]]
        }

        this.graph.setOption(this.option)
      },
      deep: true
    }
  },
  mounted() {
    this.getVariables()
    this.createGraph("Trajectory")

  },
  methods: {
    getVariables() {

    },
    createGraph(type){
      var dom = document.getElementById("chart-container")
      this.graph = echarts.init(dom)
      var app = {};
      this.option = {
          tooltip: {
              trigger: 'axis',
              axisPointer: {
                  type: 'cross'
              }
          },
          xAxis: {
            type: 'category',
            data: this.graphData.time
          },
          yAxis: {
            type: 'value'
          },
          series: [
              {
                  type:'line',
                  data: this.graphData.data,
                  markArea: {
                      data: [[{
                          xAxis: this.daterange[0]
                      }, {
                          xAxis: this.daterange[1]
                      }]]
                  }
              }
          ]
      }

      console.log(this.option)
      if (this.option && typeof this.option === "object") {
        this.graph.setOption(this.option, true)
      }
    }
  }
}
