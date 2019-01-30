<template>
  <div>
    <v-flex xs10 offset-xs1 d-flex> 
    <v-select
      :items="items"
      label="Standard"
    ></v-select>
    </v-flex>
    <div id="chart-container">
    </div>
  </div>
</template>

<script src="./chart-component.js">
</script>

<style>
#chart-container{
  width: 360px;
  height: 300px;
  margin: 20px;
}
</style>
