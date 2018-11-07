import TimeSlider from './components/TimeSlider'
import DepthSlider from './components/DepthSlider'

export default {
  name: 'app',
  components: {
    "v-time-slider": TimeSlider,
    "v-depth-slider": DepthSlider
  },
  data () {
    return {
      map: null,
      extent: []
    }
  },
  mounted() {
    this.$refs.timeslider.$on('time-extent-update', (event) => {
      console.log('time-extent-update', event)
      this.timeExtent = event;
    })
    this.map = this.$refs.map.map
    this.map.on('load', () => {
      this.addLayers()
      this.loadLayers(this.extent)
    })
  },
  methods: {
    addLayers(){
      this.map.addLayer({
          "id": "ODV visualization 2",
          "type": "heatmap",
          "source":
          {
            "url": "mapbox://siggyf.c9ly3p32",
            "type": "vector"
          },
          "source-layer": "odv-abrwqf",
          "layout": {},
          "paint": {
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
    },
    loadLayers(extent){
      console.log('loadlayers', extent)
      // var N = 
      // [...Array(N)].map((_,i) => i+extent[0]);
    }
  }
}
