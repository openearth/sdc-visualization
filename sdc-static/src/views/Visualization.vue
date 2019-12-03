<template>
  <div>
    <div id="t-slider">
        <v-time-slider
          ref="timeslider"
          show-play
          interval="years"
          >
        </v-time-slider>
    </div>
    <v-navigation-drawer class="navdrawer" app floating temporary right width="400" hide-overlay v-model="plotDrawer">
        <v-card v-if="series && series.meta">
            <v-card-title>
                <h2>{{ series.meta.cdi_id }}</h2>
            </v-card-title>
            <v-card-text>
                <chart-component :date-range="dateRange" :series="series">
                </chart-component>
                <table>
                    <tr v-for="(value, key) in series.meta"  :key="key">
                        <th>{{ key }}</th><td>{{ value }}</td>
                    </tr>
                </table>
            </v-card-text>
        </v-card>
    </v-navigation-drawer>
    <v-app-bar height="64px" fixed app>
      <v-btn icon :to="{name: 'home'}">
        <v-icon>home</v-icon>
      </v-btn>
      <v-toolbar-title>SeaDataCloud</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click.stop="showMapSettings = !showMapSettings">
        <v-icon>settings</v-icon>
      </v-btn>
      <v-btn icon @click.stop="plotDrawer = !plotDrawer">
        <v-icon>show_chart</v-icon>
      </v-btn>
      <v-btn icon @click="load">
        <v-icon>cloud_download</v-icon>
      </v-btn>
    </v-app-bar>
    <v-content class="map">
        <v-mapbox
          access-token="pk.eyJ1Ijoic2lnZ3lmIiwiYSI6Il8xOGdYdlEifQ.3-JZpqwUa3hydjAJFXIlMA"
          map-style="mapbox://styles/mapbox/dark-v9"
          :center="[6.082391473108373, 42.787369913791025]"
          :zoom="6.014224349175116"
          :pitch="60"
          :min-zoom="6"
          :bearing="-0.7939713170276262"
          class="map"
          ref="map"
          container="map">
        </v-mapbox>
    </v-content>
    <map-settings :showMapSettings.sync="showMapSettings" :map="map">
    </map-settings>

</div>
</template>

<script src="./visualization.js">
</script>

<style scoped>

/* Visualization */
@import '~mapbox-gl/dist/mapbox-gl.css';
.navdrawer {
  top: 64px !important;
  height: calc(100vh - 64px) !important;
}
.map {
  width: 100%;
  height: calc(100vh - 64px);
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
