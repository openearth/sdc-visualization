import Vue from 'vue';
import echarts from 'echarts'

export default {
  name: "chart-component",
  data () {
    return {
      graph: null,
      graphdaterange: null,
      option: null
    }
  },
  props: {
    daterange: {
      type: Array
    }
  },
  watch: {
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

        console.log(this.option)
        this.graph.setOption(this.option)
      },
      deep: true
    }
  },
  mounted() {
    this.createGraph("Trajectory")
  },
  methods: {
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
            data: [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019]
          },
          yAxis: {
            type: 'value'
          },
          series: [
              {
                  type:'line',
                  data: [300, 280, 250, 260, 270, 300, 550, 500, 400, 390, 380, 390, 400, 500, 600, 750, 800, 700, 600, 400],
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
