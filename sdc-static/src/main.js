import Vue from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'
import Vuetify from 'vuetify';
import Vue2MapboxGL from 'vue2mapbox-gl';
import 'vuetify/dist/vuetify.min.css';

Vue.use(Vue2MapboxGL);
Vue.use(Vuetify);

Vue.config.productionTip = false

new Vue({
    router,
  store,
  render: h => h(App)
}).$mount('#app')