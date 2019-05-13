import Vue from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'
// we're using vuetify for some pages and bootstrap for others,
// include proper  css per view
import Vuetify from 'vuetify';


import Vue2Filters from 'vue2-filters'
import Vue2MapboxGL from 'vue2mapbox-gl'

import  'vuetify/dist/vuetify.min.css'

Vue.use(Vue2MapboxGL);
Vue.use(Vuetify);
Vue.use(Vue2Filters)

Vue.config.productionTip = false

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app')
