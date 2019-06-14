import { mapActions, mapState } from 'vuex'

// TODO: use proper date formatting
// import moment from 'moment'
import _ from 'lodash'

import TimeSlider from '@/components/TimeSlider'
import DepthSlider from '@/components/DepthSlider'
import ChartComponent from '@/components/ChartComponent'
import store from '@/store.js'



export default {
    store,
    name: 'visualization',
    components: {
        "v-time-slider": TimeSlider,
        "v-depth-slider": DepthSlider,
        "chart-component": ChartComponent
    },
    data () {
        return {
            menudrawer: false,
            plotdrawer: true,
            map: null,
            end: 2017,
            begin: 2007,
            daterange: [2007, 2017],
            timerange: [],
            graphData: {time: [], data: []},
            hoverFeature: null,
            items: [
                { title: 'Home', icon: 'dashboard' },
                { title: 'About', icon: 'question_answer' }
            ],
        }
    },
    mounted() {
        this.getTimeRange()
        // by default only load last year
        this.$store.commit('requestYear', this.end)
        // now we can request to load  layer data
        this.loadLayerData()
            .then(() => {
                this.loadLayers()
            })
        this.$refs.timeslider.$on('time-extent-update', (event) => {

            this.daterange = [
                _.toInteger(event.from_pretty),
                _.toInteger(event.to_pretty)
            ]
            let range = _.range(this.daterange[0], this.daterange[1] + 1)
            _.each(range, (year) => {
                this.$store.commit('requestYear', year)
            })
            this.loadLayerData()
                .then(() => {
                    this.loadLayers()
                })
            console.log('daterange',  this.daterange, event)
            this.showLayer(event.from_pretty, event.to_pretty)
        })
        this.map = this.$refs.map.map
        this.map.on('load', () => {
            this.map.addLayer({
                "id": `point_layer`,
                "type": "circle",
                "source":
                {
                    "data": {type: 'FeatureCollection', features: []},
                    "type": "geojson"
                },
                "layout": {},
                "paint": {
                    'circle-color': 'hsla(180, 100%, 80%, 0.49)' ,
                }
            })
            this.map.on('mousemove', (e) => {
                let year = this.daterange[1]
                let yearRange = _.range(this.daterange[0], this.daterange[1])
                let layers = _.map(yearRange, (year) => `point_${year}`)
                // set bbox as 5px reactangle area around clicked point
                let buffer = 2
                let bbox = [[e.point.x - buffer, e.point.y - buffer], [e.point.x + buffer, e.point.y + buffer]]
                if(this.map.getSource(`point_${year}`)) {
                    let features = this.map.queryRenderedFeatures(bbox, { layers: layers })
                    this.map.getSource('point_layer').setData({type: 'FeatureCollection', features: features})
                    if (features.length) {
                        this.hoverFeature = _.first(features)
                    } else {
                        this.hoverFeature = null
                    }
                }
            })
            this.map.on('mouseover', 'point_layer', (e) => {
                console.log('mouseover', e)
            })
            this.map.on('click', 'point_layer', (e) => {
                console.log('click', e)
                if (_.isNil(this.hoverFeature)) {
                    return
                }
                this.$store.commit('feature', this.hoverFeature)
                this.loadFeature()
            })
        })
    },
    watch: {
        layers () {
            this.loadLayers()
        }
    },
    computed: {
        ...mapState([
            'layers',
            'series'
        ])
    },
    methods: {
        ...mapActions([
            'loadData',
            'loadLayerData',
            'loadPoint',
            'loadFeature'
        ]),
        load () {
            // load demo data
            const filename = '/remote.php/webdav/viz/data_from_SDN_2017-11_TS_profiles_non-restricted_med.nc'
            this.$store.commit('filename', filename)
            this.loadData()
            this.$store.commit('requestYear', 2017)
            this.$store.dispatch('loadLayerData')
                .then(() => {
                    this.loadLayers()
                })
        },
        loadLayers () {
            // loop over all layers and check if they're loaded. If not add  it.
            _.each(this.layers, layer => {
                if(!this.map.getSource(layer.id)){
                    // add the layer
                    this.map.addLayer(layer)
                }
            })

        },
        getTimeRange() {
            fetch(`${store.state.serverUrl}/api/extent`, {
                method: "GET"
            })
                .then((res) => {
                    return res.json();
                })
                .then((response) => {
                    this.extent = response.time
                })

        },
        showLayer(from, to){
            var range = _.range(this.end, this.begin - 1, -1)
            var years = _.range(to, from - 1, -1)
            console.log('years', years)
            range.forEach((year) => {
                var mapLayer = this.map.getLayer(`heatmap_${year}`)
                console.log('mapLayer', mapLayer)
                if(mapLayer !== undefined){
                    console.log(years, year, years.indexOf(year) >= 0, years.includes(year))
                    if(years.includes(year)){
                        this.map.setPaintProperty( `heatmap_${year}`, 'heatmap-opacity', 1)
                        // this.map.setPaintProperty( `point_${year}`, 'circle-opacity', 1)

                    } else {
                        this.map.setPaintProperty( `heatmap_${year}`, 'heatmap-opacity', 0)
                        this.map.setPaintProperty( `point_${year}`, 'circle-opacity', 0)
                    }
                }
            })
        }
    }
}
