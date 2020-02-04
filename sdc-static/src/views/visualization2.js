import {
  mapActions,
  mapState
} from 'vuex'

// todo: use proper date formatting
// import moment from 'moment'
import _ from 'lodash'

import timeSlider from '@/components/TimeSlider'
import depthSlider from '@/components/DepthSlider'
import chartComponent from '@/components/ChartComponent'
import chartComponent3D from '@/components/ChartComponent3D'
import mapSettings from '@/components/MapSettings'
import store from '@/store.js'
import layers from './ts-layers.json'
import sources from './ts-sources.json'

export default {
  store,
  name: 'visualization',
  components: {
    "v-time-slider": timeSlider,
    "v-depth-slider": depthSlider,
    "chart-component": chartComponent,
    "map-settings": mapSettings,
    'chart-component-3d': chartComponent3D
  },
  data() {

    return {
      showMapSettings: false,
      menuDrawer: false,
      plotDrawer: true,
      map: null,
      end: 2015,
      begin: 2000,
      dateRange: [2014, 2015],
      timeRange: [],
      graphData: {
        time: [],
        data: []
      },
      hoverFeature: null,
      items: [{
          title: 'home',
          icon: 'dashboard'
        },
        {
          title: 'about',
          icon: 'question_answer'
        }
      ],
      tab: null
    }
  },
  mounted() {
    this.getTimeRange()
    this.loadDataTable()
    // by default only load last year
    this.$store.commit('requestYear', this.end)
    // now we can request to load  layer data

    this.$refs.timeslider.$on('time-extent-update', (event) => {
      this.dateRange = [
        _.toInteger(event.from_pretty),
        _.toInteger(event.to_pretty)
      ]
      this.setFilter()
    })
    this.map = this.$refs.map.map
    this.map.on('load', () => {

      // this.map.addSource("sdc-med-profiles", {
      //     "url": "mapbox://siggyf.sdc-med-profiles",
      //     "type": "vector"
      // })
      _.forEach(sources, (source, id) => {
        this.map.addSource(id, source)
      })
      // add the hover layers
      this.map.addSource('point-layer', {
        "data": {
          type: 'FeatureCollection',
          features: []
        },
        "type": "geojson"
      })
      layers.forEach(layer => {
        this.map.addLayer(layer)
      })

      this.map.on('mousemove', (e) => {
        let year = this.dateRange[1]
        let yearRange = _.range(this.dateRange[0], this.dateRange[1])
        // set bbox as 5px reactangle area around clicked point
        let buffer = 2
        let bbox = [
          [e.point.x - buffer, e.point.y - buffer],
          [e.point.x + buffer, e.point.y + buffer]
        ]
        let features = this.map.queryRenderedFeatures(bbox, {
          layers: this.circleLayers
        })

        // TODO: is  this needed?
        //  features = JSON.parse(JSON.stringify(features))

        this.map.getSource('point-layer').setData({
          type: 'FeatureCollection',
          features: features
        })
        this.map.triggerRepaint()
        if (features.length) {
          this.map.getCanvas().style.cursor = 'pointer'
          this.hoverFeature = _.first(features)
        } else {
          this.hoverFeature = null
          this.map.getCanvas().style.cursor = ''

        }
      })
      this.map.on('click', 'point-layer', (e) => {

        if (_.isNil(this.hoverFeature)) {
          return
        }
        this.$store.commit('feature', this.hoverFeature)
        this.navdrawer = true
        this.$store.commit('series', this.$store.state.dataTable)
      })
      this.setFilter()
    })
  },
  computed: {
    ...mapState([
      'layers',
      'series',
      'dataTable'
    ]),
    circleLayers() {
      let circleLayers = layers.filter(
        (layer) => layer.type === 'circle' && layer['source-layer']
      )
      circleLayers = circleLayers.map(x => x.id)
      return circleLayers
    },
    heatmapLayers() {
      let heatmapLayers = layers.filter(
        (layer) => layer.type === 'heatmap' && layer['source-layer']
      )
      heatmapLayers = heatmapLayers.map(x => x.id)
      return heatmapLayers
    }

  },
  methods: {
    ...mapActions([
      'loadData',
      'loadLayerData',
      'loadDataTable'
    ]),
    load() {
      // load demo data
      const filename = '/remote.php/webdav/viz/data_from_SDN_2015-09_TS_MedSea_QC_done_v2.nc'
      this.$store.commit('filename', filename)
      this.loadData()
      this.$store.commit('requestYear', 2017)
      this.$store.dispatch('loadLayerData')
        .then(() => {
          this.loadLayers()
        })
    },
    setFilter() {
      let filter = [
        'all',
        ['>=', 'year', this.dateRange[0]],
        ['<=', 'year', this.dateRange[1]]
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
