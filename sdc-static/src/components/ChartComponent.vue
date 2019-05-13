<template>
<div>
    <v-container fluid>
        <v-layout wrap align-center>
            <v-flex xs12>
                <v-select
                    :items="variables"
                    v-model="x"
                    label="X"
                    >
                </v-select>
                <v-select
                    :items="variables"
                    v-model="y"
                    label="Y"
                    ></v-select>
            </v-flex>
            <v-flex xs12 v-show="series">
                <div id="chart-container">
                </div>
            </v-flex>
        </v-layout>
    </v-container>
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
