import TimeSlider from '@/components/TimeSlider'
import DepthSlider from '@/components/DepthSlider'
import moment from 'moment'
import ChartComponent from '@/components/ChartComponent'
import store from '@/store.js'

export default {
  store,
  name: 'map',
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
      begin: 1986,
      daterange: [],
      timerange: []
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
      console.log('loaded')
      // this.loadLayers()
      // this.loadMaplayers()
      this.map.on('click', () => {
        console.log('click')
      })
    })
    console.log(this, this.$refs)

  },
  methods: {
    getTimeRange() {
      fetch(`${store.state.serverUrl}api/extent`, {
          method: "GET"
        })
      .then((res) => {
        return res.json();
      })
      .then((response) => {
        console.log('get timerange', response)
        this.extent = response.time
      })

    },
    // loadMaplayers() {
    //   fetch(`${store.state.serverUrl}/api/slice?`, {
    //     method: "GET"
    //   })
    //   .then((res) => {
    //     return res.json();
    //   })
    //   .then((response) => {
    //     this.map.addLayer({
    //         "id": 'cruises',
    //         "type": "heatmap",
    //         "source":
    //         {
    //           "data": response,
    //           "type": "geojson"
    //         },
    //         "layout": {},
    //         "paint": {
    //           "heatmap-opacity": 0,
    //           "heatmap-color": [
    //             "interpolate",
    //             ["linear"],
    //             ["heatmap-density"],
    //             0,
    //             "rgba(0, 0, 255, 0)",
    //             0.3,
    //             "hsla(180, 100%, 50%, 0.49)",
    //             1,
    //             "hsl(185, 100%, 100%)"
    //           ],
    //             "heatmap-radius": [
    //               "interpolate",
    //               ["linear"],
    //               ["zoom"],
    //               4,
    //               1,
    //               22,
    //               15
    //           ]
    //         }
    //     })
    //   })
    // },
    loadLayers(){
      var range = ([...Array(this.end - this.begin)].map((_,i) => this.end - i))
      range.forEach((year) => {
        fetch(`${store.state.serverUrl}/api/slice?year=${year}`, {
          method: "GET"
        })
        .then((res) => {
          return res.json();
        })
        .then((response) => {
          console.log('load layers', year, response)
          this.map.addLayer({
              "id": String(year),
              "type": "heatmap",
              "source":
              {
                "data": response,
                "type": "geojson"
              },
              "layout": {},
              "paint": {
                "heatmap-opacity": 0,
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
          })
        })
      })
    },
    showLayer(from, to){
      var range = ([...Array(this.end - this.begin)].map((_,i) => i + this.begin))
      var years = ([...Array(to - from)].map((_,i) => i + parseInt(from)))
      range.forEach((year) => {
        var mapLayer = this.map.getLayer(String(year))
        // console.log('mapLayer', mapLayer)
        if(mapLayer !== undefined){
          // console.log(years, year, years.indexOf(year) >= 0)
          if(years.indexOf(year) >= 0){
            this.map.setPaintProperty(String(year), 'heatmap-opacity', 1);
          } else {
            this.map.setPaintProperty(String(year), 'heatmap-opacity', 0);
          }
        }
      })
    }
  }
}
