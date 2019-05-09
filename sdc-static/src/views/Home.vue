<template>
<b-container fluid>
    <b-row>

        <b-col sm="auto" cols="3"
               >
            <b-card title="Credentials"
                    img-src="form.png"
                    img-alt="Form"
                    img-top
                    tag="article"
                    class="action h-100"
                    >
                <p class="card-text">
                    Fill in your b2drop credentials
                </p>
                <b-button href="#/credentials" :variant="$store.state.credentials ? 'success' : 'primary'">Go</b-button>
            </b-card>
        </b-col>

        <b-col sm="auto" cols="3">
            <b-card title="File selector"
                    img-src="file-selector.png"
                    img-alt="File selector"
                    img-top
                    tag="article"
                    class="action h-100">
                <p class="card-text">
                    Select a file to use for visualization in the map.
                </p>
                <b-button href="#/file-selector"
                          :disabled="!$store.state.credentials"
                          :variant="$store.state.metadata ? 'success' : 'primary'">Go</b-button>
        </b-card></b-col>
        <b-col sm="auto" cols="3">
            <b-card title="Visualization"
                    img-src="mapbox.png"
                    img-alt="Map"
                    img-top
                    tag="article"
                    class="action h-100">
                <p class="card-text">
                    Create visualizations on the map
                </p>
                <b-button href="#/visualization" variant="primary" :disabled="!$store.state.credentials">Go</b-button>
            </b-card>
        </b-col>
        <b-col sm="auto" cols="3">
            <b-card title="Visualization Notebook"
                    img-src="nav_logo.svg"
                    img-alt="Logo"
                    img-top
                    tag="article"
                    class="action h-100"
                    >
                <p class="card-text">
                    Run a visualization notebook that allows you to connect to your b2drop files.
                </p>
                <b-button href="/notebook" variant="primary">Go</b-button>
            </b-card>
        </b-col>

    </b-row>
    <b-row>
        <b-alert
            :show="show"
            dismissible
            variant="info"
            >
            {{ message }}
        </b-alert>
    </b-row>
</b-container>

</template>
<script>
import bus from '@/lib/bus'

export default {
    data () {
        return {
            message: '',
            show: false
        }
    },
    mounted () {
        bus.$on('message', (message) => {
            console.log('showing  message', message)
            this.message = message
            this.show = 5
        })
    }
}
</script>
<style>
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
