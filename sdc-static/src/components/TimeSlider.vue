<template>
  <v-toolbar
    color="white"
    floating
    dense
    role="slider"
    class="time-slider"
    >
    <div class="time-slider-wrapper">
      <input type="text" class="slider" name="slider" value="" />
    </div>

    <!-- TODO: use toolbar or whatever... -->
    <v-btn-toggle v-model="state" mandatory v-if="showPlay">
      <!-- call play function so timer gets updated -->
      <!-- TODO: use buttons that stay pressed (lookup material design guideline) -->
      <v-btn value="playing" flat @click.stop="play">
        <v-icon>fa-play</v-icon>
      </v-btn>
      <v-btn value="paused" flat @click.stop="pause">
        <v-icon>fa-pause</v-icon>
      </v-btn>
    </v-btn-toggle>
    <v-btn-toggle v-model="loop" v-if="showPlay">
      <!-- somehow this ends op as null/true instead of false/true -->
      <v-btn :value="true" flat>
        <v-icon>fa-repeat</v-icon>
      </v-btn>
    </v-btn-toggle>
    <v-btn @click.stop="configDialog = true"  icon flat>
      <v-icon>fa-gear</v-icon>
    </v-btn>

    <v-dialog v-model="configDialog" max-width="100%">
      <v-card>
        <v-card-text>
          <v-menu
            ref="startDateMenu"
            lazy
            :close-on-content-click="false"
            v-model="startDateMenu"
            transition="scale-transition"
            offset-y
            full-width
            :return-value.sync="startDate"
            >
            <v-text-field
              slot="activator"
              label="Picker in menu"
              v-model="startDate"
              prepend-icon="event"
              readonly
              ></v-text-field>
            <v-date-picker
              v-model="startDate"
              :allowed-dates="allowedDates"
              no-title
              scrollable
              >
              <template slot-scope="{ save, cancel }">
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn flat color="primary" @click.stop="startDateMenu = false">Cancel</v-btn>
                  <v-btn flat color="primary" @click.stop="$refs.startDateMenu.save(startDate)">OK</v-btn>
                </v-card-actions>
              </template>
            </v-date-picker>
          </v-menu>
          <v-menu
            ref="endDateMenu"
            lazy
            :close-on-content-click="false"
            v-model="endDateMenu"
            transition="scale-transition"
            offset-y
            full-width
            :return-value.sync="endDate"
            >
            <v-text-field
              slot="activator"
              label="Picker in menu"
              v-model="endDate"
              prepend-icon="event"
              readonly
              ></v-text-field>
            <v-date-picker
              v-model="endDate"
              :allowed-dates="allowedDates"
              no-title
              scrollable
              >
              <template slot-scope="{ save, cancel }">
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn flat color="primary" @click.stop="endDateMenu = false">Cancel</v-btn>
                  <v-btn flat color="primary" @click.stop="$refs.endDateMenu.save(endDate)">OK</v-btn>
                </v-card-actions>
              </template>
            </v-date-picker>
          </v-menu>
        </v-card-text>
        <v-card-actions>
          <v-btn flat color="primary" @click.stop="configDialog=false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-toolbar>
</template>
<script src="./time-slider.js"></script>


<style>
@import '~ion-rangeslider/css/ion.rangeSlider.css';
@import '~ion-rangeslider/css/ion.rangeSlider.skinHTML5.css';
@import '~font-awesome/css/font-awesome.css';

.time-slider, .v-toolbar, .v-toolbar__content {
  z-index: 1;
  margin: 0 !important;
  width: 100% !important;
  /* override nav margin-top */
}
.slider {
  width: 100%;
}
.time-slider-wrapper {
  width: 100%;
  padding-right: 40px;
}

[disabled] > .svg-inline--fa,
[disabled] > .fas {
  color: lightgrey;
  opacity: 0.5;
}
.irs-line-left,
.irs-line-mid,
.irs-line-right {
  height: 2px;
}

.irs-line {
  height: 2px;
  background: rgba(0, 0, 0, 0.26);
  border: none;
  border-color: none;
  border-image: none;
  border-style: none;

}
.irs-bar {
  height: 2px;
  background: #1976D2;
}
.irs-slider {
  border-radius: 50%;
  background: #1976D2;
  width: 16px;
  height: 16px;
  box-shadow: none;
  border: none;
}

.irs-slider:hover {
  transform: scale(1.2);
  background: #1976D2;
}
.irs-slider.state_hover {
  transform: scale(1.2);
  background: #1976D2;
}
</style>
