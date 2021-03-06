import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Visualization from './views/Visualization.vue'
import Login from './views/Login.vue'
import Debug from './views/Debug.vue'

Vue.use(Router)

export default new Router({
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home
        },
        {
            path: '/visualization',
            name: 'visualization',
            component: Visualization
        },
        {
            path: '/file-selector',
            name: 'file',
            // route level code-splitting
            // this generates a separate chunk (about.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: () => import(
                /* webpackChunkName: "about" */
                './views/File.vue'
            )
        },
        {
            path: '/credentials',
            name: 'credentials',
            component: Login
        },
        {
            path: '/debug',
            name: 'debug',
            component: Debug
        },
    ]
})
