import echarts from 'echarts'
import Vue from 'vue'
import _ from 'lodash'

// TODO: replace this with vue-echart
export default {
    name: "chart-component",
    data () {
        return {
            graph: null,
            graphDateRange: null,
            x: null,
            y: null
        }
    },
    props: {
        xRange: {
            type: Array
        },
        series: {
            type: Object
        },
        options: {
            type: Object,
            default () {
                return {}
            }
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
        },
        xyValues () {
            let values = _.zip(this.xValues, this.yValues)
            return values
        },
        xValues () {
            if (_.isNil(this.series)) {
                return []
            }
            if (_.isNil(this.x)) {
                return []
            }
            let data = this.series.data
            let x = this.x
            let values = _.map(data, x)
            return values
        },
        yValues () {
            if (_.isNil(this.series)) {
                return []
            }
            if (_.isNil(this.y)) {
                return []
            }
            let data = this.series.data
            let y = this.y
            let values = _.map(data, y)
            return values
        },
        option () {
            let options = {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross'
                    }
                },
                xAxis: {
                    min: _.min(this.xValues),
                    max: _.max(this.xValues)
                },
                yAxis: {
                    min: _.min(this.yValues),
                    max: _.max(this.yValues),
                    inverse: this.x === 'Depth'
                },
                series: [
                    {
                        symbolSize: 2,
                        type: 'scatter',
                        data: this.xyValues
                    }
                ]
            }
            options = _.merge(options, this.options)
            return options

        }

    },
    watch: {
        option (option) {
            this.graph.setOption(option)
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
            this.graph.setOption(this.option, true)

        }
    }
}
