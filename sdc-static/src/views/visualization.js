import { mapActions, mapState } from 'vuex'

// todo: use proper date formatting
// import moment from 'moment'
import _ from 'lodash'
import moment from 'moment';

import timeSlider from '@/components/TimeSlider'
import depthSlider from '@/components/DepthSlider'
import chartComponent from '@/components/ChartComponent'
import store from '@/store.js'

import layers from './ts-layers.json'
import sources from  './ts-sources.json'

import contours from '@/lib/contours.js'


export default {
  store,
  name: 'visualization',
  components: {
    "v-time-slider": timeSlider,
    "v-depth-slider": depthSlider,
    "chart-component": chartComponent
  },
  data () {
    let now = moment('2015-12-31T00:00:00')
    let then = moment('2000-01-01T00:00:00')

    const extent = [then, now]
    const domain = [then, now]
    const range = [now.subtract(1, 'year'),  then]

    return {
      menuDrawer: false,
      plotDrawer: false,
      map: null,
      extent: extent,
      domain: domain,
      range: range,
      graphData: {time: [], data: []},
      hoverFeature: null,
      items: [
        { title: 'home', icon: 'dashboard' },
        { title: 'about', icon: 'question_answer' }
      ],
    }
  },
  mounted() {
    this.getTimeRange()
    // by default only load last year
    this.$store.commit('requestYear', this.end)
    // now we can request to load  layer data

    this.map = this.$refs.map.map


    this.map.on('style.load', () => {
      this.addObjects(this.map)
    })

    this.map.on('load', () => {

      // this.map.addSource("sdc-med-profiles", {
      //     "url": "mapbox://siggyf.sdc-med-profiles",
      //     "type": "vector"
      // })
      _.forEach(sources, (source, id) => {
        this.map.addSource(id,  source)
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
        let year = this.range[1].year()
        let yearRange = _.range(this.range[0].year(), this.range[1].year())
        // set bbox as 5px reactangle area around clicked point
        let buffer = 2
        let bbox = [[e.point.x - buffer, e.point.y - buffer], [e.point.x + buffer, e.point.y + buffer]]
        let features = this.map.queryRenderedFeatures(bbox, { layers: this.circleLayers })

        // TODO: is  this needed?
        //  features = JSON.parse(JSON.stringify(features))

        this.map.getSource('point-layer').setData({type: 'FeatureCollection', features: features})
        this.map.triggerRepaint()
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
  computed: {
    ...mapState([
      'layers',
      'series'
    ]),
    yearRange () {
      let from = this.range[0].year()
      let to = this.range[1].year()
      return [from, to]
    },
    circleLayers () {
      let circleLayers = layers.filter(
        (layer) => layer.type === 'circle' && layer['source-layer']
      )
      circleLayers = circleLayers.map(x => x.id)
      return circleLayers
    },
    heatmapLayers () {
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
    addObjects (map) {
      // let url = "models/SDN_MedSea_Clim/polydata-Temperature-0005.vtk"
      // let customLayer = contours.addObjectLayer(map, 'temp-5', url, 0xff55ff)
      // map.addLayer(customLayer, 'waterway-label');

      let dirs = [
        "models/SDN_ArcticOcean_Clim",
        "models/SDN_BalticSea_Clim",
        "models/SDN_BlackSea_Clim",
        "models/SDN_MedSea_Clim",
        "models/SDN_NorthAtlanticOcean_Clim"
      ]
      dirs.forEach((dir) => {
        let url = dir + "/polydata-Temperature-0000.vtk"
        let id = dir + '-0'
        let customLayer = contours.addObjectLayer(map, id, url, 0x0022ff)
        map.addLayer(customLayer, 'waterway-label');
        url = dir + "/polydata-Temperature-0003.vtk"
        id = dir + '-3'
        customLayer = contours.addObjectLayer(map, id, url, 0xff2244)
        map.addLayer(customLayer, 'waterway-label')
        url = dir + "/polydata-Temperature-0001.vtk"
        id = dir + '-1'
        customLayer = contours.addObjectLayer(map, id, url, 0x22ff44)
        map.addLayer(customLayer, 'waterway-label')
      })
      // url = "static/polydata-Temperature-0003.vtk"
      // customLayer = ObjectLayer('temp-3', url, 0x8855ff)
      // map.addLayer(customLayer, 'waterway-label');
    },
    setFilter () {
      let filter = [
        'all',
        ['>=', 'year', this.yearRange[0]],
        ['<=',  'year', this.yearRange[1]]
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
          // this.extent = response.time
        })

    },
    setExtent(evt)  {
      console.log('evt',  evt)
    }
  }
}
