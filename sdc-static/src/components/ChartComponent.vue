<template>
<div>
    <v-container pa-0 ma-0 fluid>
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
            <v-flex xs12 v-show="series" pa-0>
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
}
</style>
