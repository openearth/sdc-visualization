<template>
<div>
    <v-container fluid>
        <v-layout pa-3>
            <v-flex sm6 pa-3>
                <v-card>
                    <v-img src="mapbox.png"></v-img>
                    <div>
                        <v-card-title>
                            <div>
                                <h2>Visualization</h2>
                                <div>Create visualizations on the map</div>
                            </div>
                        </v-card-title>

                    </div>
                    <v-card-actions>
                        <v-btn
                            flat
                            href="#/visualization"
                            >
                            Go
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-flex>
        </v-layout>
    </v-container>
    <v-snackbar
        v-model="snackbar"
        :timeout="5000"
        >
        {{ message }}
        <v-btn
            dark
            flat
            @click="snackbar = false"
            >
            Close
        </v-btn>
    </v-snackbar>
</div>
</template>
<script>

import bus from '@/lib/bus'

export default {
    data () {
        return {
            message: '',
            snackbar: false
        }
    },
    mounted () {
        bus.$on('message', (message) => {
            console.log('showing  message', message)
            this.message = message
            this.snackbar = true
        })
    }
}
</script>
<style scoped>
.action {
    max-width: 20rem;
}
.action img {
    max-height: 30rem;
}

.row {
    width: 100vw;
    padding: auto;
    margin: auto;
    margin-top: 40px;
}
</style>
