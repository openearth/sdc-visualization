<template>
<v-dialog v-model="showSettings" max-width="100%">
  <v-card>
    <v-card-text>
      <v-menu
        ref="startDateMenu"
        lazy
        :close-on-content-click="true"
        v-model="startDateMenu"
        transition="scale-transition"
        offset-y
        >
        <template v-slot:activator="{on}">
          <v-text-field
            slot="activator"
            label="Start date"
            :value="startDate"
            prepend-icon="event"
            readonly
            v-on="on"
            ></v-text-field>

        </template>
        <v-date-picker
          ref="startDatePicker"
          v-model="startDate"
          :min="allowedDates.min"
          :max="allowedDates.max"
          reactive
          no-title
          scrollable
          >
        </v-date-picker>
      </v-menu>
      <v-menu
        ref="endDateMenu"
        lazy
        :close-on-content-click="true"
        v-model="endDateMenu"
        transition="scale-transition"
        offset-y
        >
        <template v-slot:activator="{on}">
          <v-text-field
            slot="activator"
            label="End date"
            :value="endDate"
            prepend-icon="event"
            readonly
            v-on="on"
            ></v-text-field>
        </template>
        <v-date-picker
          ref="endDatePicker"
          v-model="endDate"
          :min="allowedDates.min"
          :max="allowedDates.max"
          reactive
          no-title
          scrollable
          >
        </v-date-picker>
      </v-menu>
    </v-card-text>
    <v-card-actions>
      <!-- bubble up that we close the settings -->
      <v-btn flat color="primary" @click.stop="$emit('update:showSettings', false)">Close</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
</template>
<script>
  import moment from 'moment';

  import {FORMATS} from './time-formats'

export default {
  props: {
    showSettings: {
      type: Boolean
    },
    // maximum allowed extent
    domain: {
      type: Array,
      required: true
    },
    // current extent
    extent: {
      type: Array,
      required: true
    },
    // current region, selection
    range: {
      type: Array
    }
  },
  data () {
    return {
      startDateMenu: false,
      endDateMenu: false
    }
  },
  watch: {
    startDateMenu () {
      this.$nextTick(() => { this.$refs.startDatePicker.activePicker = 'YEAR' })
    },
    endDateMenu () {
      this.$nextTick(() => { this.$refs.endDatePicker.activePicker = 'YEAR' })
    }
  },
  computed: {
    startDate: {
      get () {
        let start = this.extent[0]
        return start.format(FORMATS.day)
      },
      set (val) {
        let extent = [...this.extent]
        extent[0] = moment(val)
        this.$emit('update:extent', extent)
      }
    },
    endDate: {
      get () {
        return this.extent[1].format(FORMATS.day)
      },
      set (val) {
        let extent = [...this.extent]
        extent[1] = moment(val)
        this.$emit('update:extent', extent)
      }
    },
    allowedDates() {
      // return allowed dates, based on extent
      return {
        min: this.domain[0].format(FORMATS.day),
        max: this.domain[1].format(FORMATS.day)
      }
    }
  }
}
</script>
