import echarts from 'echarts'
import _ from 'lodash'

export default {
    name: "chart-component",
    data () {
        return {
            graph: null,
            graphDateRange: null,
            option: null,
            x: null,
            y: null,
            items: ['Temperature', 'Salinity']
        }
    },
    props: {
        xRange: {
            type: Array
        },
        series: {
            type: Object
        }
    },
    computed: {
        variables () {
            // get the names
            return _.keys(
                // get the first record
                _.first(
                    // get data if available
                    _.get(this.series, 'data')
                )
            )
        }
    },
    watch: {
        series (series) {
            if (_.isNil(series)) {
                return
            }
            this.option.series.data = series.data
            this.option.xAxis.data = series.time
            this.graph.setOption(this.option)
        },
        // Watch "layers". This is a switch, which can toggle a layer on or off
        // When toggled, this watcher will activate the toggleLayers function.
        dateRange: {
            handler: function(dateRange) {
                console.log('graphDateRange')
                this.graphDateRange = dateRange
                console.log(dateRange, parseInt(dateRange[0]), dateRange[1])
                this.option.series[0].markArea = {
                    data: [[{
                        xAxis: dateRange[0]
                    }, {
                        xAxis: dateRange[1]
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
        createGraph() {
            var dom = document.getElementById("chart-container")
            this.graph = echarts.init(dom)
            this.option = {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross'
                    }
                },
                xAxis: {
                    type: 'category',
                    data: this.series.time
                },
                yAxis: {
                    type: 'value'
                },
                series: [
                    {
                        type:'line',
                        data: this.series.data,
                        markArea: {
                            data: [[{
                                xAxis: this.dateRange[0]
                            }, {
                                xAxis: this.dateRange[1]
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
