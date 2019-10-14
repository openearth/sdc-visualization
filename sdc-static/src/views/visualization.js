import { mapactions, mapstate } from 'vuex'

// todo: use proper date formatting
// import moment from 'moment'
import _ from 'lodash'

import timeslider from '@/components/TimeSlider'
import depthslider from '@/components/DepthSlider'
import chartcomponent from '@/components/ChartComponent'
import store from '@/store.js'

import layers from './ts-layers.json'
import sources from  './ts-sources.json'



export default {
    store,
    name: 'visualization',
    components: {
        "v-time-slider": timeslider,
        "v-depth-slider": depthslider,
        "chart-component": chartcomponent
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
            graphdata: {time: [], data: []},
            hoverfeature: null,
            items: [
                { title: 'home', icon: 'dashboard' },
                { title: 'about', icon: 'question_answer' }
            ],
        }
    },
    mounted() {
        this.gettimerange()
        // by default only load last year
        this.$store.commit('requestyear', this.end)
        // now we can request to load  layer data

        this.$refs.timeslider.$on('time-extent-update', (event) => {
            this.daterange = [
                _.tointeger(event.from_pretty),
                _.tointeger(event.to_pretty)
            ]
            this.setfilter()
        })
        this.map = this.$refs.map.map
        this.map.on('load', () => {

            this.map.addsource("sdc-med-profiles", {
                "url": "mapbox://siggyf.sdc-med-profiles",
                "type": "vector"
            })
            _.foreach(sources, (source, id) => {
                this.map.addsource(id,  source)
            })
            // add the hover layers
            this.map.addsource('point-layer', {
                "data": {type: 'featurecollection', features: []},
                "type": "geojson"
            })
            layers.foreach(layer => {
                this.map.addlayer(layer)
            })

            this.map.on('mousemove', (e) => {
                let year = this.daterange[1]
                let yearRange = _.range(this.daterange[0], this.daterange[1])
                // set bbox as 5px reactangle area around clicked point
                let buffer = 2
                let bbox = [[e.point.x - buffer, e.point.y - buffer], [e.point.x + buffer, e.point.y + buffer]]
                let features = this.map.queryRenderedFeatures(bbox, { layers: this.circleLayers })
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
        ]),
        circleLayers () {
            let circleLayers = layers.filter(
                (layer) => layer.type === 'circle' && layer['source-layer']
            )
            circleLayers = circleLayers.map(x => x.id)
            return circleLayers
        },
        heatmapLayers () {
            let circleLayers = layers.filter(
                (layer) => layer.type === 'circle' && layer['source-layer']
            )
            circleLayers = circleLayers.map(x => x.id)
            return circleLayers
        }

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
            _.forEach(this.circleLayers, (layer) => {
                this.map.setFilter(layer, filter)
            })
            _.forEach(this.heatmapLayers, (layer) => {
                this.map.setFilter(layer, filter)
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

        }
    }
}
