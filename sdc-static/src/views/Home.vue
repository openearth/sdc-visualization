<template>
<div>
    <v-container fluid>
        <v-layout pa-3>
            <v-flex sm3 pa-3>
                <v-card pa-3>
                    <v-img src="form.png"></v-img>
                    <div>
                        <v-card-title>
                            <div>
                                <h2>Credentials</h2>
                                <div>Fill in your b2drop credentials</div>
                            </div>
                        </v-card-title>

                    </div>
                    <v-card-actions>
                        <v-btn
                            flat
                            href="#/credentials"
                            :color="$store.state.credentials ? '' : 'primary'"
                            >Go</v-btn>
                    </v-card-actions>
                </v-card>


            </v-flex>
            <v-flex sm3 pa-3>
                <v-card>
                    <v-img src="file-selector.png"></v-img>
                    <div>
                        <v-card-title>
                            <div>
                                <h2>File selector</h2>
                                <div>Select a file to use for visualization in the map</div>
                            </div>
                        </v-card-title>

                    </div>
                    <v-card-actions>
                        <v-btn
                            flat
                            href="#/file-selector"
                            :disabled="!$store.state.credentials"
                            :color="$store.state.metadata ? '' : 'primary'"
                            >
                            Go
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-flex>
            <v-flex sm3 pa-3>
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
                            :disabled="!$store.state.credentials"
                            >
                            Go
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-flex>
            <v-flex sm3 pa-3>
                <v-card>
                    <v-img src="nav_logo.svg"></v-img>
                    <div>
                        <v-card-title>
                            <div>
                                <h2>Notebook</h2>
                                <div>Run a visualization notebook that allows you to connect to your b2drop files.</div>
                            </div>
                        </v-card-title>

                    </div>
                    <v-card-actions>
                        <v-btn
                            flat
                            href="/notebook"
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
