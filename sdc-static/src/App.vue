<template>
  <div id="app" class="container">
      <router-view></router-view>
  </div>
</template>

<script>
import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'


Vue.use(BootstrapVue)

export default {
  name: 'App',
  components: {
  },
  methods: {
  },
  mounted () {
  },
  watch: {
  },
  computed: {
  },
  data () {
    return {
    }
  }
}
</script>

<style>
</style>
