import Vue from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'
import vuetify from './plugins/vuetify'

import Vue2Filters from 'vue2-filters'
import Vue2MapboxGL from 'vue2mapbox-gl'

Vue.use(Vue2MapboxGL);
Vue.use(Vue2Filters)

Vue.config.productionTip = false

new Vue({
    vuetify,
    router,
    store,
    render: h => h(App)
}).$mount('#app')
