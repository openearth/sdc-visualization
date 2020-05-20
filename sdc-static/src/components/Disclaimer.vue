<template>
  <div>
    <v-dialog
      v-model="disclaimer"
      persistent
      scrollable
      max-width="500px"
    >
      <v-card dark>
        <v-card-title>
          <span class="headline">
            Welcome
          </span>
        </v-card-title>
        <v-card-text>
          Welcome! Here is the visualization service for large odv data collections and climatologies.
        </v-card-text>
        <v-card-actions>
          <v-row justify="center" class="pa-0 ma-0">
            <v-btn @click.stop="hideDisclaimer" color="primary" dark
                   >Continu
            </v-btn>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
// import * as Cookies from 'tiny-cookie'

export default {
  data () {
    // let disclaimer = Cookies.get('disclaimer')
    // if not set yet, return true
    // if (disclaimer === null) {
    //   disclaimer = true
    // }
    // if (disclaimer === 'false') {
    //   disclaimer = false
    // }
    return {
      disclaimer: true
    }
  },
  methods: {
    hideDisclaimer () {
      this.disclaimer = false
      // Cookies.set('disclaimer', false)
    }
  }
}
</script>
