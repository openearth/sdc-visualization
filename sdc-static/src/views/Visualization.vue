<template>
<div>
  <div class="t-slider">
    <v-time-slider ref="timeslider" show-play interval="years">
    </v-time-slider>
  </div>
  <v-navigation-drawer class="navdrawer" app absolute floating stateless fixed hide-overlay clipped right width="400" v-model="object3DDrawer">
    <v-card>
      <v-card-title>
        <h2>3D map layers controls</h2>
      </v-card-title>
      <v-card-text>
        <v-form>
          <v-select v-model="object3DType" :items="['salinity', 'Temperature']"></v-select>
          <v-switch v-model="showObject3D" class="mx-2" label="Show 3d map layer" @change="toggleObject3D"></v-switch>

        </v-form>
      </v-card-text>
    </v-card>
  </v-navigation-drawer>

  <v-navigation-drawer class="navdrawer" app absolute floating stateless fixed hide-overlay clipped right width="400" v-model="plotDrawer">
    <v-tabs v-model="tab" background-color="secondary" centered dark icons-and-text>
      <v-tabs-slider></v-tabs-slider>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-tab v-on="on" href="#tab-1">
            Location
            <v-icon>my_location</v-icon>
          </v-tab>
        </template>
        <span>Explore the profile of a single location in the map. Select proper X and Y.</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-tab v-on="on" href="#tab-2">
            Area
            <v-icon>timeline</v-icon>
          </v-tab>
        </template>
        <span>Explore the profiles of locations within the bounding box.</span>
      </v-tooltip>


    </v-tabs>
    <v-tabs-items v-model="tab">
      <v-tab-item value="tab-1">

        <v-card v-if="series && series.meta">
          <v-card-title>
            <h2>{{ series.meta.cdi_id }}</h2>
          </v-card-title>
          <v-card-text>
            <chart-component :date-range="dateRange" :series="series">
            </chart-component>
            <table>
              <tr v-for="(value, key) in series.meta" :key="key">
                <th>{{ key }}</th>
                <td>{{ value }}</td>
              </tr>
            </table>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item value="tab-2">
        <v-card>
          <v-card-title>
            <h2>Cruise data</h2>
          </v-card-title>
          <v-card-text>
            <chart-component-3d type="scatter3D" :dataset="dataTable" :profileIds="profileIds">
            </chart-component-3d>
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </v-navigation-drawer>
  <v-app-bar height="64px" fixed app>
    <v-btn icon :to="{name: 'home'}">
      <v-icon>home</v-icon>
    </v-btn>
    <v-toolbar-title>SeaDataCloud</v-toolbar-title>
    <v-spacer></v-spacer>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn v-on="on" icon href="https://github.com/openearth/sdc-visualization/wiki" target="_blank">
          <v-icon>info</v-icon>
        </v-btn>
      </template>
      <span>Additional information on wikipage. </span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn v-on="on" icon @click.stop="showMapSettings = !showMapSettings">
          <v-icon>settings</v-icon>
        </v-btn>
      </template>
      <span>Change map settings.</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn v-on="on" icon @click.stop="plotDrawer = !plotDrawer; object3DDrawer = false">
          <v-icon>show_chart</v-icon>
        </v-btn>
      </template>
      <span>Tooltip</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn v-on="on" icon @click="object3DDrawer = !object3DDrawer; plotDrawer = false">
          <v-icon>terrain</v-icon>
        </v-btn>
      </template>
      <span>Switch to Temperature / Switch to salinity.</span>
    </v-tooltip>

  </v-app-bar>
  <v-content class="map">
    <v-mapbox access-token="pk.eyJ1Ijoic2lnZ3lmIiwiYSI6Il8xOGdYdlEifQ.3-JZpqwUa3hydjAJFXIlMA" map-style="mapbox://styles/mapbox/dark-v9" :center="[6.082391473108373, 42.787369913791025]" :zoom="6.014224349175116" :pitch="60" :min-zoom="6" :bearing="-0.7939713170276262"
      class="map" ref="map" container="map">
    </v-mapbox>
  </v-content>
  <map-settings :showMapSettings.sync="showMapSettings" :map="map">
  </map-settings>

  <disclaimer />
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

.t-slider {
  position: absolute;
  left: 20vw;
  bottom: 5vh;
  width: 60vw;
  right: 80vw;
  z-index: 100;
}

.boxdraw {
  background: rgba(56, 135, 190, 0.1);
  border: 2px solid #3887be;
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
}
</style>
