<template>
  <div id="app" data-app>
    <!-- <div id="d-slider">
      <v-depth-slider>
      </v-depth-slider>
    </div> -->
    <div id="t-slider">
        <v-time-slider
          ref="timeslider"
          show-play
          fixedHandles
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

<script src="./app.js">
</script>

<style>
@import '~mapbox-gl/dist/mapbox-gl.css';

html, body {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 100%;
  height: 100%;
}

#map {
  width: 100%;
  height: 100%;
}

#t-slider{
  position: absolute;
  left: 20vw;
  bottom: 5vh;
  width: 60vw;
  right: 80vw;
}

#d-slider{
  /* position: absolute; */
  left: 50vw;
  bottom: 50vh;
  width: 500px;
  height: 500px;
  transform: rotate(90deg);
}
</style>
