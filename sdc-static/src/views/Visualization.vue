<template>
<div id="map" >
    <!-- <div id="d-slider">
         <v-depth-slider>
         </v-depth-slider>
    </div> -->
    <!-- <v-navigation-drawer mini-variant id="menudrawer" hide-overlay app v-model="menudrawer">

         </v-navigation-drawer> -->
    <v-navigation-drawer right id="plotdrawer" width="400" hide-overlay app v-model="plotdrawer">
        <v-card v-if="hoverFeature">
            <v-card-title>
                <h2>CDI ID: {{ hoverFeature.properties.cdi_id }}</h2>
            </v-card-title>
        </v-card>
      <chart-component :date-range="daterange" :graph-data="graphData">
      </chart-component>
    </v-navigation-drawer>
    <v-toolbar height="64px" fixed>
      <v-toolbar-side-icon @click.stop="menudrawer = !menudrawer"></v-toolbar-side-icon>
      <v-toolbar-title>SeaDataCloud</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click.stop="plotdrawer = !plotdrawer">
        <v-icon>show_chart</v-icon>
      </v-btn>
      <v-btn icon @click="load">
        <v-icon>cloud_download</v-icon>
      </v-btn>
    </v-toolbar>
    <div id="t-slider">
        <v-time-slider
          ref="timeslider"
          show-play
          interval="years"
          >
        </v-time-slider>
    </div>
    <v-mapbox
      access-token="pk.eyJ1Ijoic2lnZ3lmIiwiYSI6Il8xOGdYdlEifQ.3-JZpqwUa3hydjAJFXIlMA"
      map-style="mapbox://styles/mapbox/dark-v9"
      :center="[6.082391473108373, 42.787369913791025]"
      :zoom="6.014224349175116"
      :pitch="60"
      :bearing="-0.7939713170276262"
      id="map"
      ref="map"
      container="map">
    </v-mapbox>
  </div>
</template>

<script src="./visualization.js">
</script>

<style scoped>

/* Visualization */
@import '~mapbox-gl/dist/mapbox-gl.css';

#map {
  top: 64px;
  width: 100vw;
  height: 100%;
}
#t-slider{
  position: absolute;
  left: 20vw;
  bottom: 5vh;
  width: 60vw;
  right: 80vw;
}
#menudrawer, #plotdrawer {
  top: 64px;
  z-index: 1;
  overflow-y: overlay;
  max-height: calc(100% - 64px);
}
</style>
