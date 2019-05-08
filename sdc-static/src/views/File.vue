<template>
<div>
    <!-- create a space for the file selector to load -->
    <iframe id="file-selector" name="file-selector"></iframe>
    <!-- put all form elements in a form from which the result is loaded in the iframe above -->
    <form id="file-selector-form" action="https://webodv.seadatacloud.ml/file_selector" method="post" target="file-selector">
        <input type="hidden" name="b2drop_username" :value="username">
        <input type="hidden" name="b2drop_password" :value="password">
        <input type="hidden" name="b2drop_url" :value="url">
    </form>
    <!-- for testing, load a local file -->
    <div>
        <button @click="load('~/data/odv/data_from_SDN_2017-11_TS_profiles_non-restricted_med.nc')">load test file</button>
    </div>
</div>
</template>
<style>
#file-selector {
    width: 100vw;
    height: 80vh;
}
</style>
<script>
import _ from 'lodash'
export default {
    mounted () {
        const iframe = document.getElementById('file-selector')

        window.addEventListener(
            "message", this.receiveMessage, false
        )
        console.log('iframe', iframe)
        const form = document.getElementById('file-selector-form')
        console.log('iframe', iframe, form)
        form.submit()
    },
    computed: {
        form () { return document.getElementById('file-selector-form') },
        username () { return this.$store.state.credentials.username },
        url () { return this.$store.state.credentials.url },
        password () { return this.$store.state.credentials.password }
    },
    watch: {
        username () { this.form.submit() },
        password () { this.form.submit() },
        url () { this.form.submit() }

    },
    data () {
        return {
        }
    },
    methods: {
        receiveMessage(message) {
            // we expect a message from .ml
            if (message.origin !== 'https://webodv.seadatacloud.ml') {
                return
            }
            // names are in here
            let names = message.data.dataid

            const b2dropPath = this.$store.state.b2dropPath
            // remove the php part inline
            names = _.map(
                names,
                name => {
                    return _.replace(name, '/remote.php/webdav', b2dropPath)
                }
            )
            const filename = _.first(names)
            this.load(filename)
            this.loadMetadata(filename)
            this.$router.push({name: 'home'})
        },
        load(filename) {
            const url = this.$store.state.serverUrl + `/api/load`
            const body = { filename }
            return fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                redirect: 'follow', // manual, *follow, error
                referrer: 'no-referrer', // no-referrer, *client
                body: JSON.stringify(body), // body data type must match 'Content-Type' header
            })
                .then(response => {
                    const result = response.json()
                    return result
                } ); // parses response to JSON            fetch(server, )
        },
        loadMetadata(filename) {
            const url = this.$store.state.serverUrl + `/api/dataset`
            const body = { filename }
            return fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                redirect: 'follow', // manual, *follow, error
                referrer: 'no-referrer', // no-referrer, *client
                body: JSON.stringify(body), // body data type must match 'Content-Type' header
            })
                .then(response => {
                    const result = response.json()
                    this.$emit('metadata', result)
                    return result
                } )
        }
    }
}
</script>
