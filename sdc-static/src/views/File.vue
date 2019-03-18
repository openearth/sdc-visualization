<template>
<div>
    <!-- create a space for the file selector to load -->
    <iframe id="file-selector" name="file-selector"></iframe>
    <!-- put all form elements in a form from which the result is loaded in the iframe above -->
    <form id="file-selector-form" action="https://webodv.seadatacloud.ml/file_selector" method="post" target="file-selector">
        <input type="hidden" name="b2drop_username" :value="user.name">
        <input type="hidden" name="b2drop_password" :value="user.password">
        <input type="hidden" name="b2drop_url" :value="b2drop.url">
    </form>
    <!-- for testing, load a local file -->
    <div>
        <button @click="load('~/data/odv/data_from_SDN_2017-11_TS_profiles_non-restricted_med.nc')">load test file</button>
    </div>
    <div>
        <button @click="load('D:/sdc-visualization/data/odv/data_from_SDN_2017-11_TS_profiles_non-restricted_med.nc')">load test file in relative path</button>
    </div>
</div>
</template>

<script>
</script>

<style>
#file-selector {
    width: 100vw;
    height: 80vh;
}
</style>
<script>
import _ from 'lodash'
import user from './user.json'
import store from '@/store.js'

export default {
  store,
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
    data () {
        return {
            user,
            b2drop: {
                url: 'https://b2drop.eudat.eu/remote.php/webdav/'
            }
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
            console.log(names)
            const b2dropPath = this.b2drop.url
            // remove the php part inline
            names = _.map(
                names,
                name => {
                    return _.replace(name, '/remote.php/webdav', b2dropPath)
                }
            )
            const name = _.first(names)
            this.load(name)
            this.$router.push({name: 'home'})
        },
        load(filename) {
            const url = `${store.state.serverUrl}/api/load`
            const body = { filename }
            console.log('filename', filename)
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
                .then(response => response.json()); // parses response to JSON            fetch(server, )
        }
    }
}
</script>
