<template>
<div>
    <v-form @submit="onSubmit" v-if="show">
        <v-container>
            <v-layout wrap>
                <v-flex xs12>
                    <h2>B2drop application credentials</h2>
                </v-flex>


                <v-flex
                    xs8
                    >
                    <v-text-field
                        id="b2drop_username"
                        v-model="form.username"
                        type="text"
                        label="b2drop user name"
                        :rules="[rules.required]"
                        hint="Make sure you use the application user name"
                        >
                    </v-text-field>
                </v-flex>
                <v-flex
                    xs8
                    >
                    <v-text-field
                        id="b2drop_password"
                        v-model="form.password"
                        type="password"
                        label="b2drop password"
                        :rules="[rules.required]"
                        placeholder="Enter password"
                        hint="Make sure you use the b2drop application password "
                        >
                    </v-text-field>
                </v-flex>
                <v-flex
                    xs8
                    >
                    <v-select
                        v-model="form.url"
                        :items="urls"
                        label="Standard"
                        ></v-select>
                </v-flex>
                <v-flex xs12>
                    <v-btn type="submit" variant="primary">Submit</v-btn>
                </v-flex>
            </v-layout>
        </v-container>
    </v-form>
</div>
</template>
<script>
import Vue from 'vue'
import Vuelidate from 'vuelidate'

import { required, minLength } from 'vuelidate/lib/validators'

Vue.use(Vuelidate)

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
            rules: {
                required
            },
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
<style scoped>
</style>
