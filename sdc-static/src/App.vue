<template>
<div id="app" >
    <v-app>
        <router-view></router-view>
    </v-app>
</div>
</template>

<script>
import Vue from 'vue'
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
#app {
    font-family: 'Roboto', 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
    width: 100vw;
    height: 100vh;
  margin: 0;
  padding: 0;
}
</style>
