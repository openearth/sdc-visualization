<template>
<div>
    <b-container>
        <b-form @submit="onSubmit" v-if="show">
            <b-form-group
                id="b2drop-group"
                label="b2drop user name:"
                label-for="b2drop_username"
                description="Make sure you use the application user name"
                >
                <b-form-input
                    id="b2drop_username"
                    v-model="form.username"
                    type="text"
                    :state="!$v.form.username.$invalid"
                    required
                    placeholder="Enter b2drop user name"
                    >
                </b-form-input>
            </b-form-group>

            <b-form-group id="input-group-2" label="b2drop password:" label-for="b2drop_password">
                <b-form-input
                    id="b2drop_password"
                    v-model="form.password"
                    type="password"
                    required
                    :state="!$v.form.password.$invalid"
                    placeholder="Enter password"
                    >
                </b-form-input>
            </b-form-group>
            <b-form-group id="input-group-3" label="b2drop url:" label-for="b2drop_url">
                <b-form-select v-model="form.url" :options="urls"></b-form-select>
            </b-form-group>

            <b-button type="submit" variant="primary">Submit</b-button>
        </b-form>
    </b-container>
</div>
</template>
<script>
import Vue from 'vue'
import Vuelidate from 'vuelidate'

import { required, minLength, helpers } from 'vuelidate/lib/validators'

Vue.use(Vuelidate)

const uuid = helpers.regex('uuid', /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/)

export default {
    name: 'Login',
    data() {
        return {
            form: {
                username: '',
                password: '',
                url: 'https://nc.seadatacloud.ml/remote.php/webdav/'
            },
            urls: [
                {value: 'https://b2drop.eudat.eu/remote.php/webdav/', text: 'b2drop'},
                {value: 'https://nc.seadatacloud.ml/remote.php/webdav/', text: 'nc'}
            ],
            show: true
        }
    },
    validations: {
        form: {
            username: {
                required
            },
            password: {
                required,
                between: minLength(4)
            },
            url: {
                required
            }
        }
    },
    methods: {
        onSubmit(evt) {
            evt.preventDefault()
            this.$store.commit('credentials', this.form)
            this.$router.push({name: 'home'})
        }
    }
  }
</script>
<style>
</style>
