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

import { mapActions } from 'vuex'

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
        ...mapActions([
            'loadData'
        ]),
        receiveMessage(message) {
            // we expect a message from .ml
            if (message.origin !== 'https://webodv.seadatacloud.ml') {
                return
            }
            // names are in here
            let names = message.data.dataid

            const filename = _.first(names)

            this.$store.commit('filename', filename)
            this.loadData()
            this.$router.push({name: 'home'})
        }
    }
}
</script>
