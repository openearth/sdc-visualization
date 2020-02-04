import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'lodash'
import bus from '@/lib/bus'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    serverUrl: process.env.VUE_APP_REST,
    b2dropPath: process.env.VUE_APP_B2DROP,
    copy: process.env.VUE_APP_COPY === 'true' ? true : false,
    filename: '',
    credentials: null,
    metadata: null,
    point: null,
    feature: null,
    series: null,
    layers: [],
    requestedYears: [],
    dataTable: []
  },
  mutations: {
    credentials(state, credentials) {
      Vue.set(state, 'credentials', credentials)
    },
    metadata(state, metadata) {
      Vue.set(state, 'metadata', metadata)
    },

    point(state, point) {
      Vue.set(state, 'point', point)
    },
    feature(state, feature) {
      Vue.set(state, 'feature', feature)
    },
    series(state, series) {
      console.log(series, 'series')
      Vue.set(state, 'series', series)
    },
    dataTable(state, dataTable) {
      Vue.set(state, 'dataTable', dataTable)
    },
    requestYear(state, year) {
      if (_.includes(state.requestYears, year)) {
        // it's already there
        return
      }
      // add it, sort  it
      let years = _.sortBy(
        _.uniq(
          _.concat(state.requestedYears, year)
        )
      )
      // set it
      Vue.set(state, 'requestedYears', years)

    },
    addLayer(state, layer) {
      state.layers.push(layer)
    },
    clearLayers(state) {
      Vue.set(state, 'layers', [])
    },
    filename(state, filename) {
      const b2dropPath = state.b2dropPath
      // remove the php part inline
      filename = _.replace(filename, '/remote.php/webdav', b2dropPath)
      Vue.set(state, 'filename', filename)
    }
  },
  actions: {
    loadData({
      commit,
      dispatch,
      state
    }) {
      bus.$emit('message', 'Opening file. This will take a while (30s).')

      const url = state.serverUrl + `/api/load`

      // TODO: allow to copy if webdav becomes fast enough
      const body = {
        filename: state.filename
      }

      // load data and post a message
      return fetch(url, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          },
          redirect: 'follow', // manual, *follow, error
          referrer: 'no-referrer', // no-referrer, *client
          body: JSON.stringify(body), // body data type must match 'Content-Type' header
        })
        .then(response => {
          const result = response.json()
          return result
        })
        .then(json => {
          console.log('reponse from load', json)
          bus.$emit('message', 'File opened, wait for metadata to load to continue to the visualisation.')
        })
    },
    loadMetadata({
      commit,
      dispatch,
      state
    }) {
      const url = state.serverUrl + `/api/dataset`
      return fetch(url, {
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        .then(response => {
          const result = response.json()
          return result
        })
        .then(json => {
          commit('metadata', json)
          bus.$emit('message', 'Metadata loaded. You can now start the visualisation.')
        })
    },
    loadLayerData({
      commit,
      state
    }) {
      console.log('loadLayerData', state.requestedYears)
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
      _.each(state.requestedYears, (year) => {
        let id = `heatmap_${year}`
        // if we already have a layer, return it
        if (_.find(state.layers, ['id', id])) {
          return
        }
        let url = `${state.serverUrl}/api/slice?year=${year}`
        fetch(url)
          .then((res) => {
            return res.json();
          })
          .then((json) => {
            let heatmapLayer = {
              "id": `heatmap_${year}`,
              "type": "heatmap",
              "source": {
                "data": json,
                "type": "geojson"
              },
              "layout": {},
              "paint": heatmapPaint
            }
            let pointLayer = {
              "id": `point_${year}`,
              "type": "circle",
              "source": {
                "data": json,
                "type": "geojson"
              },
              "layout": {},
              "paint": {
                'circle-opacity': 0
              }
            }
            commit('addLayer', heatmapLayer)
            commit('addLayer', pointLayer)

          })

      })

    },
    loadDataTable({
      state,
      commit
    }) {
      let url = "./med_test.json"
      return fetch(url)
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        console.log('commiting datatable ')
        json = [['a', 'b', 'c', 'd'], [1, 1, 1, 1], [2, 2, 2, 2]]
        commit('dataTable', json)
      })
    },
    // loadPoint({
    //   state,
    //   commit
    // }) {
    //   let pt = state.point
    //   let url = `${state.serverUrl}/api/get_timeseries?lon=${pt.lng}&lat=${pt.lat}`
    //   return fetch(url)
    //     .then((res) => {
    //       return res.json();
    //     })
    //     .then((json) => {
    //       commit('series', json)
    //     })
    //
    //
    // },
    loadFeature({
      state,
      commit
    }) {
      let feature = state.feature
      console.log('loading', feature)
      let searchParams = new URLSearchParams()
      searchParams.append('cdi_id', feature.properties.cdi_id)
      searchParams.append('dataset', feature.properties.dataset)
      let searchString = searchParams.toString()
      let url = `${state.serverUrl}/api/get_timeseries?${searchParams}`
      console.log('loading ', url)
      return fetch(url)
        .then((res) => {
          return res.json();
        })
        .then((json) => {
          console.log('yes timeseries loaded')
          commit('series', json)
        })


    }

  }
})
