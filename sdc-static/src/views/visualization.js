import { mapActions, mapState } from 'vuex'

// TODO: use proper date formatting
// import moment from 'moment'
import _ from 'lodash'

import TimeSlider from '@/components/TimeSlider'
import DepthSlider from '@/components/DepthSlider'
import ChartComponent from '@/components/ChartComponent'
import store from '@/store.js'

import layers from './layers.json'



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
            begin: 2000,
            daterange: [2016, 2017],
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

        this.$refs.timeslider.$on('time-extent-update', (event) => {
            this.daterange = [
                _.toInteger(event.from_pretty),
                _.toInteger(event.to_pretty)
            ]
            this.setFilter()
        })
        this.map = this.$refs.map.map
        this.map.on('load', () => {
            this.map.addSource("sdc-med-profiles", {
                "url": "mapbox://siggyf.sdc-med-profiles",
                "type": "vector"
            })
            // add the hover layers
            this.map.addSource('point-layer', {
                "data": {type: 'FeatureCollection', features: []},
                "type": "geojson"
            })
            layers.forEach(layer => {
                this.map.addLayer(layer)
            })

            this.map.on('mousemove', (e) => {
                let year = this.daterange[1]
                let yearRange = _.range(this.daterange[0], this.daterange[1])
                // set bbox as 5px reactangle area around clicked point
                let buffer = 2
                let bbox = [[e.point.x - buffer, e.point.y - buffer], [e.point.x + buffer, e.point.y + buffer]]
                let features = this.map.queryRenderedFeatures(bbox, { layers: ['circles'] })
                this.map.getSource('point-layer').setData({type: 'FeatureCollection', features: features})
                if (features.length) {
                    this.hoverFeature = _.first(features)
                } else {
                    this.hoverFeature = null
                }
            })
            this.map.on('click', 'point-layer', (e) => {
                console.log('click', e)
                if (_.isNil(this.hoverFeature)) {
                    return
                }
                this.$store.commit('feature', this.hoverFeature)
                this.loadFeature()
            })
            this.setFilter()
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
        setFilter () {
            let filter = [
                'all',
                ['>=', 'year', this.daterange[0]],
                ['<=',  'year', this.daterange[1]]
            ]
            this.map.setFilter('heatmap', filter)
            this.map.setFilter('circles', filter)
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

        }
    }
}
