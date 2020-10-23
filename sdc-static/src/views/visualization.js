import {
  mapActions,
  mapState, 
} from 'vuex'

// todo: use proper date formatting
// import moment from 'moment'
import _ from 'lodash'
import Disclaimer from '@/components/Disclaimer'
import timeSlider from '@/components/TimeSlider'
import depthSlider from '@/components/DepthSlider'
import chartComponent from '@/components/ChartComponent'
import mapSettings from '@/components/MapSettings'
import chartComponent3D from '@/components/ChartComponent3D'
import store from '@/store.js'
import layers from './ts-layers.json'
import sources from './ts-sources.json'

// TODO: change to fetch
import contours from '@/lib/contours.js'

import MapboxDraw from '@mapbox/mapbox-gl-draw'
import DrawRectangle from 'mapbox-gl-draw-rectangle-mode'


function componentToHex(c) {
  var hex = Math.round(c).toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return Number("0x" + componentToHex(r) + componentToHex(g) + componentToHex(b));
}


export default {
  store,
  name: 'visualization',
  components: {
    "v-time-slider": timeSlider,
    "v-depth-slider": depthSlider,
    "chart-component": chartComponent,
    "map-settings": mapSettings,
    'chart-component-3d': chartComponent3D,
    Disclaimer
  },
  data() {

    return {
      showMapSettings: false,
      menuDrawer: false,
      plotDrawer: false,
      object3DDrawer: false,
      showObject3D: true,
      // only works for temperature for now
      object3DType: 'Temperature',
      map: null,
      end: 2015,
      begin: 2000,
      dateRange: [2014, 2015],
      objectLayers: {},
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
      tab: null,
      profileIds: [],
      features: null
    }
  },
  mounted() {
    this.getTimeRange()
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
    this.map.on('style.load', () => {
      this.addObjects(this.map)
    })
    var modes = MapboxDraw.modes
    modes.draw_polygon = DrawRectangle
    var draw = new MapboxDraw({
      controls: {
        polygon: true,
        trash: true
      },
      modes: modes,
      displayControlsDefault: false
    })
    this.map.addControl(draw, 'top-left')
    this.map.on('load', () => {
      this.map.on('draw.create', (e) => {
        draw.deleteAll()
        draw.add(e.features[0])
        const data = draw.getAll()
        if (data.features.length) {
            console.log('geojson', data.features)
            this.$store.commit('setGeojson', JSON.parse(data.features))
        }
        const NW = this.map.project(e.features[0].geometry.coordinates[0][3])
        const SE = this.map.project(e.features[0].geometry.coordinates[0][1])
        const features = this.map.queryRenderedFeatures([NW, SE], {
          layers: this.circleLayers
        })
        this.profileIds = features.map(feat => {
          return feat.properties.cdi_id
        })
      })

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
        // let year = this.dateRange[1]
        // let yearRange = _.range(this.dateRange[0], this.dateRange[1])
        // set bbox as 5px reactangle area around clic ked point
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
          this.hoverFeature = _.first(features)
        } else {
          this.hoverFeature = null
        }
      })
      this.map.on('click', 'point-layer', () => {
        if (_.isNil(this.hoverFeature)) {
          return
        }
        this.$store.commit('feature', this.hoverFeature)
        this.loadFeature()
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
      'loadDataTable',
      'loadFeature'
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
    async addObjects(map) {
      this.objectLayers = {}
      const resp = await fetch('models/meta.json')
      const meta = await resp.json()
      console.log('meta', meta)
      meta.forEach((model) => {

        const variable = _.get(this.objectLayers, model.variable)

        if (model.variable !== 'Temperature') {
          return
        }
        model.paths.forEach((path, i) => {
          const url = `models/${path}`
          const color = rgbToHex(model.colors[i][0] * 255, model.colors[i][1] * 255, model.colors[i][2] * 255)
          let customLayer = contours.addObjectLayer(map, path, url, color, model)
          map.addLayer(customLayer, 'waterway-label')

          if (variable) {
            this.objectLayers[model.variable].push(path)
          } else {
            this.objectLayers[model.variable] = []
          }
        })
      })
    },
    toggleObject3D() {
      const vis = this.showObject3D ? 'visible' : 'none'
      this.objectLayers[this.object3DType].forEach (layer => {
        this.map.setLayoutProperty(layer, 'visibility', vis)
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
