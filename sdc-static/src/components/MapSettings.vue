<template>
<v-dialog width="50vw" v-model="modal">
    <v-card>
        <v-card-title>
            Map layer settings
        </v-card-title>
        <v-card-text>
            <v-menu ref="menu" v-model="menu" transition="scale-transition" :close-on-content-click="false" offset-y min-width="290px">
                <template v-slot:activator="{ on }">
                    <v-text-field autofocus v-model="circleColor" :color="circleColor" label="Choose color" prepend-icon="palette" readonly v-on="on"></v-text-field>
                </template>
                <v-color-picker mode="hsla" v-model="circleColor" hide-inputs hide-mode-switch></v-color-picker>
                <v-btn text color="primary" @click="menu = false">Done</v-btn>
            </v-menu>
            <v-slider v-model="circleSize" min="0" max="100" :label="`Circle size: ${circleSize}`" @input="setPaintProperty('circle-size', circleSize)"></v-slider>
        </v-card-text>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text>
                Save Settings
            </v-btn>
        </v-card-actions>

    </v-card>
</v-dialog>
</template>

<script>
export default {
    name: 'map-settings',
    props: {
        showMapSettings: {
            type: Boolean,
            required: true
        },
        map: {
            type: Object
        }
    },
    data() {
        return {
            menu: false,
            circleColor: "hsla(180, 100%, 80%, 0.49)",
            circleSize: 5
        }
    },
    computed: {
        modal: {
            get() {
                return this.showMapSettings
            },
            set(val) {
                this.$emit("update:showMapSettings", val)
            }
        }
    }
}
</script>

<style lang="css" scoped></style>
