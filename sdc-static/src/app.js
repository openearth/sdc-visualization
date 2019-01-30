import TimeSlider from './components/TimeSlider'
import DepthSlider from './components/DepthSlider'
import moment from 'moment'
import ChartComponent from './components/ChartComponent'

export default {
  name: 'app',
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
      daterange: []
    }
  },
  mounted() {
    this.$refs.timeslider.$on('time-extent-update', (event) => {
      this.daterange = [event.from_pretty, event.to_pretty]
      // this./showLayer(event.from_pretty, event.to_pretty)
    })
    // fetch(SERVER_URL + '/map/satellite/times/', {
    //     method: "GET"
    //   })
    //   .then((res) => {
    //     return res.json();
    //   })
    //   .then((response) => {
    //     console.log(response)
    //     this.end = 2018
    //     this.begin = 2000
    //   })
    this.map = this.$refs.map.map
    this.map.on('load', () => {
      // this.addLayers()
      console.log('loaded')
      this.loadLayers()
    })
    console.log(this, this.$refs)

  },
  methods: {
    loadLayers(){
      var range = ([...Array(this.end - this.begin)].map((_,i) => this.end - i))
      range.forEach((year) => {
        fetch("http://127.0.0.1:5000/api/slice?year=" + year, {
          method: "GET"
        })
        .then((res) => {
          return res.json();
        })
        .then((response) => {
          console.log(response)
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
        console.log('mapLayer', mapLayer)
        if(mapLayer !== undefined){
          console.log(years, year, years.indexOf(year) >= 0)
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
