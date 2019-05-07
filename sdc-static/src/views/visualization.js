import TimeSlider from '@/components/TimeSlider'
import DepthSlider from '@/components/DepthSlider'
import moment from 'moment'
import ChartComponent from '@/components/ChartComponent'
import store from '@/store.js'

const heatmapPaint = {
  "heatmap-opacity": 1,
  "heatmap-color": [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0,
    "rgba(0, 0, 255, 0)",
    0.3,
    "hsla(180, 100%, 50%, 0.49)",
    1,
    "hsl(185, 100%, 100%)"
  ],
    "heatmap-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      4,
      1,
      22,
      15
  ]
}


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
      daterange: [],
      timerange: [],
      graphData: {time: [], data: []},
      items: [
  { title: 'Home', icon: 'dashboard' },
  { title: 'About', icon: 'question_answer' }
],
    }
  },
  mounted() {
    this.getTimeRange()
    this.$refs.timeslider.$on('time-extent-update', (event) => {
      this.daterange = [event.from_pretty, event.to_pretty]
      this.showLayer(event.from_pretty, event.to_pretty)
    })
    this.map = this.$refs.map.map
    this.map.on('load', () => {

      this.retrieveLayers()
      this.loadLayers()
      this.map.addLayer( {
                        "id": `point_layer`,
                        "type": "circle",
                        "source":
                        {
                          "data": {type: 'FeatureCollection', features: []},
                          "type": "geojson"
                        },
                        "layout": {},
                        "paint": {
                            'circle-color': 'pink' ,
                        }
                    })
      // this.loadMaplayers()
      this.map.on('mousemove', (e) => {
          var year = this.daterange[0]
          // set bbox as 5px reactangle area around clicked point
          var buffer = 2
          var bbox = [[e.point.x - buffer, e.point.y - buffer], [e.point.x + buffer, e.point.y + buffer]]
          if(this.map.getSource(`point_${year}`)) {
              var features = this.map.queryRenderedFeatures(bbox, { layers: [`point_${year}`] })
              this.map.getSource('point_layer').setData({type: 'FeatureCollection', features: features})

          }
      })
      this.map.on('mouseover', 'point_layer', (e) => {
          console.log('mouseover', e)
      })
      this.map.on('click', 'point_layer', (e) => {
          fetch(`${store.state.serverUrl}/api/get_timeseries?lon=${e.lngLat.lng}&lat=${e.lngLat.lat}`, {
            method: "GET"
          })
          .then((res) => {
            return res.json();
          })
          .then((response) => {
              this.graphData = response
              console.log(response)
          })

        console.log('click', e)
      })
    })
  },
  methods: {
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

    retrieveLayers(){
      var range = ([...Array(this.end - this.begin)].map((_,i) => this.end - i))
      range.forEach((year) => {
        console.log(this.$store.state.layers, `heatmap_${year}`, this.$store.state.layers.find(x => x.id == `heatmap_${year}`))
        if(! this.$store.state.layers.find(x => x.id == `heatmap_${year}`)) {
            fetch(`${store.state.serverUrl}/api/slice?year=${year}`, {
              method: "GET"
            })
            .then((res) => {
              return res.json();
            })
            .then((response) => {
            var layer = {
                "id": `heatmap_${year}`,
                "type": "heatmap",
                "source":
                {
                  "data": response,
                  "type": "geojson"
                },
                "layout": {},
                "paint": heatmapPaint
            }
            this.$store.commit('addLayer', layer)
              var pointlayer = {
                  "id": `point_${year}`,
                  "type": "circle",
                  "source":
                  {
                    "data": response,
                    "type": "geojson"
                  },
                  "layout": {},
                  "paint": {
                      'circle-opacity': 0
                  }
              }
              this.$store.commit('addLayer', pointlayer)

            })
        }
          })
    },
    loadLayers() {
        this.$store.state.layers.forEach(layer => {
            if(!this.map.getSource(layer.id)){
                this.map.addLayer(layer)
            }
        })
    },
    showLayer(from, to){
      var range = ([...Array(this.end - this.begin)].map((_,i) => i + this.begin))
      var years = ([...Array(to - from)].map((_,i) => i + parseInt(from)))
      console.log('years', years)
      range.forEach((year) => {
        var mapLayer = this.map.getLayer(`heatmap_${year}`)
        // console.log('mapLayer', mapLayer)
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
