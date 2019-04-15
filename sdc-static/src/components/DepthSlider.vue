<template>
  <v-toolbar
    color="rgba(0, 0, 0, 0)"
    floating
    dense
    flat
    role="slider"
    class="depth-slider"
    >
    <div class="time-slider-wrapper">
      <input type="text" class="d-slider" name="d-slider" value=""  />
    </div>
  </v-toolbar>
</template>
<script src="./depth-slider.js"></script>


<style scoped>
@import '~ion-rangeslider/css/ion.rangeSlider.css';
@import '~ion-rangeslider/css/ion.rangeSlider.skinHTML5.css';
@import '~font-awesome/css/font-awesome.css';

input {
  -webkit-appearance: slider-vertical;

}
</style>
