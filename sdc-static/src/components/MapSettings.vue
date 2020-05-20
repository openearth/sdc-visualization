<template>
<v-dialog width="50vw" v-model="modal">
    <v-card>
        <v-card-title>
            Map layer settings
        </v-card-title>
        <v-card-text>
            <v-menu ref="menu" v-model="menu" transition="scale-transition" :close-on-content-click="false" offset-y min-width="290px">
                <template v-slot:activator="{ on }">
                    <v-text-field autofocus :value="settings['heatmap-color'].valueString(settings['heatmap-color'].value)" :color="settings['heatmap-color'].valueString(settings['heatmap-color'].value)" label="Choose color" prepend-icon="palette" readonly v-on="on"></v-text-field>
                </template>
                <v-color-picker mode="hsla" v-model="settings['heatmap-color'].value" hide-inputs hide-mode-switch></v-color-picker>
                <v-btn text color="primary" @click="menu = false">Done</v-btn>
            </v-menu>
            <v-slider v-model="settings['heatmap-radius'].value" min="0" max="100" :label="`Circle size: ${settings['heatmap-radius'].value}`" @input="updateMap"></v-slider>
        </v-card-text>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="resetSettings">
                Reset
            </v-btn>
            <v-btn color="primary" text @click='modal = false'>
                Close
            </v-btn>
        </v-card-actions>

    </v-card>
</v-dialog>
</template>

<script>
import _ from 'lodash'

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
            settings: {
              'heatmap-color': {
                value: {
                  "h": 240,
                  "s": 1,
                  "l": 0.5,
                  "a": 0
                },
                default: {
                  "h": 240,
                  "s": 1,
                  "l": 0.5,
                  "a": 0
                },
                valueString: (value) => {
                  return `hsla(${parseInt(value.h)}, ${parseInt(value.s)}, ${parseInt(value.l)}, ${parseInt(value.a)})`
                },
                layer: 'heatmap-medsea',
                mapboxConf: value => {
                  const color = `hsla(${parseInt(value.h)}, ${parseInt(value.s)}, ${parseInt(value.l)}, ${parseInt(value.a)})`
                  const middleColor = `hsla(${parseInt(value.h)}, 1, 0.5, 0.49)`
                  return [
                     "interpolate",
                     [
                       "linear"
                     ],
                     [
                       "heatmap-density"
                     ],
                     0,
                     color,
                     0.3,
                     middleColor,
                     1,
                     "hsl(185, 100%, 100%)"
                   ]
                 }
              },
              'heatmap-radius': {
                value: 5,
                default: 5,
                layer: 'heatmap-medsea',
                mapboxConf: value => {
                  return [
                     "interpolate",
                     [
                       "linear"
                     ],
                     [
                       "zoom"
                     ],
                     4,
                     1,
                     22,
                     value
                   ]
                }
            }
        }
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
    },
    mounted() {
    },
    methods: {
      resetSettings() {
        Object.keys(this.settings).forEach(key => {
          const setting = _.get(this.settings, key)
          setting.value = setting.default
        })
        this.updateMap()
      },
      updateMap() {
        Object.keys(this.settings).forEach(key => {
          const setting = _.get(this.settings, key)
          console.log(setting.mapboxConf(setting.value))
          this.map.setPaintProperty(setting.layer, key, setting.mapboxConf(setting.value))
        })
      }
    }
}
</script>

<style lang="css" scoped></style>
