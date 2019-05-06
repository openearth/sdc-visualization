import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        serverUrl: "http://localhost:5000",
        credentials: null,
        layers: []
    },
    mutations: {
        credentials (state, credentials) {
            Vue.set(state, 'credentials', credentials)
        },
        addLayer(state, layer) {
            state.layers.push(layer)
        }

    },
    actions: {

    }
})
