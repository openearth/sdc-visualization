<template>
<div id="map" >
    <v-navigation-drawer right id="plotdrawer" width="400" hide-overlay app v-model="plotDrawer">
        <v-card v-if="series && series.meta">
            <v-card-title>
                <h2>{{ series.meta.cdi_id }}</h2>
            </v-card-title>
            <v-card-text>
                <chart-component :date-range="range" :series="series">
                </chart-component>
                <table>
                    <tr v-for="(value, key) in series.meta"  :key="key">
                        <th>{{ key }}</th><td>{{ value }}</td>
                    </tr>
                </table>
            </v-card-text>
        </v-card>
    </v-navigation-drawer>
    <v-toolbar height="64px" fixed>
      <v-btn icon :to="{name: 'home'}">
        <v-icon>home</v-icon>
      </v-btn>
      <v-toolbar-title>SeaDataCloud</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click.stop="plotDrawer = !plotDrawer">
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
          :domain="domain"
          :extent.sync="extent"
          :range.sync="range"
          @update:range="setFilter"
          >
        </v-time-slider>
    </div>
    <v-mapbox
      access-token="pk.eyJ1Ijoic2lnZ3lmIiwiYSI6Il8xOGdYdlEifQ.3-JZpqwUa3hydjAJFXIlMA"
      map-style="mapbox://styles/mapbox/dark-v9"
      :center="[6.082391473108373, 42.787369913791025]"
      :zoom="6.014224349175116"
      :pitch="60"
      :min-zoom="6"
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
