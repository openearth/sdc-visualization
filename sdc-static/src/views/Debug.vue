<template>
<div>
    <h2>Actions</h2>
    <div>
        <v-btn @click="load">load data</v-btn>
        <v-btn @click="loadOnePoint">load point</v-btn>
    </div>

    <h2>Chart</h2>
    <chart-component :series="series" :x-range="dateRange" >
    </chart-component>
    <h2 class="metadata">metadata</h2>
    <pre>
        {{ this.$store.state.metadata }}
    </pre>
</div>
</template>
<script>
import ChartComponent from '@/components/ChartComponent'
import { mapState, mapActions } from 'vuex'
export default {
    components: {
        "chart-component": ChartComponent
    },
    data () {
        return {
            dateRange: [2015, 2016]
        }
    },
    computed: {
        ...mapState([
            'point',
            'series'
        ])
    },
    methods: {
        ...mapActions([
            'loadData',
            'loadPoint'
        ]),
        load () {
            // load demo data
            const filename = '/remote.php/webdav/viz/data_from_SDN_2017-11_TS_profiles_non-restricted_med.nc'
            this.$store.commit('filename', filename)
            this.loadData()
        },
        loadOnePoint () {
            let point = {lng: 10, lat: 30}
            this.$store.commit('point', point)
            this.loadPoint()

        }

    }

}
</script>
<style scoped>

/* Visualization */



</style>
