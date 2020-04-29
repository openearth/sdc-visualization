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
      <v-btn value="playing" small icon @click.stop="play">
        <v-icon>fa-play</v-icon>
      </v-btn>
      <v-btn value="paused" small icon @click.stop="pause">
        <v-icon>fa-pause</v-icon>
      </v-btn>
    </v-btn-toggle>
    <v-btn-toggle v-model="loop" small icon v-if="showPlay">
      <!-- somehow this ends op as null/true instead of false/true -->
      <v-btn :value="true" text>
        <v-icon>fa-repeat</v-icon>
      </v-btn>
    </v-btn-toggle>
    <!-- <v-btn @click.stop="configDialog = true"  icon text>
      <v-icon>fa-gear</v-icon>
    </v-btn> -->

    <v-dialog v-model="configDialog" max-width="100%">
      <v-card>
        <v-card-title>
          Timeslider settings
        </v-card-title>
        <v-card-text>
          <v-menu
            ref="startDateMenu"
            lazy
            :close-on-content-click="true"
            v-model="startDateMenu"
            transition="scale-transition"
            offset-y
            full-wid
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
          <v-btn text color="primary" @click.stop="configDialog=false">Close</v-btn>
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
