import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        serverUrl: process.env.VUE_APP_REST,
        b2dropPath: process.env.VUE_APP_B2DROP,
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
