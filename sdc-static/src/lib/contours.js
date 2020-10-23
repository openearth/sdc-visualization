import * as THREE from 'three/build/three.module.js'
import {VTKLoader} from 'three/examples/jsm/loaders/VTKLoader.js'
import mapboxgl from 'mapbox-gl'

function addObjectLayer(map, id, url, color, metadata) {
  // todo, use metadata properly

  // parameters to ensure the model is georeferenced correctly on the map

  // this is the vertical scaling of the geometry.
  // As we are not using models in m but in mapbox coordinate we have to significantly scale our model in the vertical. The vertical height should be something like half of the circumcenter of the earth. So about 40,007.863 km  / 2.
  // for a depth of 1km  you need something like 0.00001249754
  // but then we want to exagerate it a bit so we multiply that by a factor of about 6
  var multiplyZ = 0.000008

  // we already precomputed models to mapbox coordinates
  var modelOrigin = [0, 0] // metadata.lon_min, metadata.lat_min]
  var modelAltitude = 0;
  var modelRotate = [0, 0, 0];

  var modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
    modelOrigin,
    modelAltitude
  );
  // this is what you would normally use
  var modelScale = modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()

  // but we prescaled the models
  modelScale = 1

  // transformation parameters to position, rotate and scale the 3D model onto the map
  var modelTransform = {
    // same here, everything is prescaled
    // translateX: modelAsMercatorCoordinate.x,
    // translateY: modelAsMercatorCoordinate.y,
    // translateZ: modelAsMercatorCoordinate.z,
    translateX: 0,
    translateY: 0,
    translateZ: 0,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    /* Since our 3D model is in real world meters, a scale transform needs to be
     * applied since the CustomLayerInterface expects units in MercatorCoordinates.
     */
    scale: modelScale
  };

  // configuration of the custom layer for a 3D model per the CustomLayerInterface
  var customLayer = {
    id: id,
    type: 'custom',
    renderingMode: '3d',
    onAdd: function(map, gl) {
      this.camera = new THREE.PerspectiveCamera();
      // this is the whole earth
      this.camera.far = 1;
      // make this very small, see above (this is 80m, so when you come closer than 80m) objects dissapear
      this.camera.near = 0.000001
      this.scene = new THREE.Scene();

      // So this is a the coordinate system:
      // x - EW (0, 0) -> 0.5, 0.5
      // y - NS (0, 0) ->  0.5, 0.5
      // z - depth  (0.1 == very high (8000km)

      // if you want to test light on a simple object, you can add the sphere below

      // var sphereGeometry = new THREE.SphereBufferGeometry( 0.001, 32, 32);
      // var sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
      // var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
      // sphere.position.set(0.5, 0.35, 0.001)
      // sphere.castShadow = true; //default is false
      // sphere.receiveShadow = true; //default
      // this.scene.add( sphere )

      // TODO: add a floor to cast shadows and add an extra land surface map to receive them
      // https://stackoverflow.com/questions/58243572/unable-to-cast-a-shadow-with-three-js-and-mapbox-gl
      // floor.receiveShadow = true;
      // floor.rotation.set(Math.PI / -2, 0, 0);
      // floor.position.set(0, 0, 0);
      // floor.scale.x = 10000
      // floor.scale.y = 1000000
      // this.scene.add(floor)

      // use the three.js GLTF loader to add the 3D model to the three.js scene
      var loader = new VTKLoader();
      loader.load(
        url,
        function(geometry) {
          geometry.computeVertexNormals();

          var meshMaterial = new THREE.MeshPhongMaterial({
            color: color,
            flatShading: false,
            // transparency: 0.6,
            wireframe: false,
            // metalness: 0.1,
            // roughness: 0.8,
            // alphaTest: 0.5,
            side: THREE.DoubleSide,
            // transparent: true,
            emissive: 0x555555,
            // opacity: 0.5
          });

          var mesh = new THREE.Mesh(geometry, meshMaterial);

          mesh.castShadow = true;
          mesh.receiveShadow = true;
          // vertical reference is not rescaled, so scale it now
          mesh.scale.z = multiplyZ;

          this.scene.add(mesh);
          // make it available global, for debugging/demos.
          window.mesh = mesh
        }.bind(this)
      )


      // TODO: focusss

      var target = new THREE.Object3D()
      target.position.set(0.5, 0.5, 0)
      target.scale.z = multiplyZ;
      this.scene.add(target)


      var directionalLight = new THREE.DirectionalLight( 0xFFFFFF, 30)

      // set to north, east of meridean
      directionalLight.position.set(0.6, 0.2, 0.01)
      directionalLight.castShadow = true;            // default false
      directionalLight.target = target
      directionalLight.scale.z = multiplyZ;
      this.scene.add(directionalLight)

      window.directionalLight  = directionalLight

      // let directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 0.01)
      // directionalLightHelper.scale.z = multiplyZ
      // this.scene.add(directionalLightHelper)

      // var pointLight = new THREE.PointLight( 0xFFFFFF, 10 );
      // pointLight.position.set(0.4, 0.5, -0.1)
      // pointLight.castShadow = true;            // default false
      // this.scene.add(pointLight)



      this.map = map;

      // use the Mapbox GL JS map canvas for three.js
      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      });
      this.renderer.setClearColor(0xcccccc)
      this.renderer.shadowMap.enabled = true
      this.renderer.autoClear = false;
      // this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    },
    render: function(gl, matrix) {
      var rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        modelTransform.rotateX
      );
      var rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        modelTransform.rotateY
      );
      var rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        modelTransform.rotateZ
      );

      var m = new THREE.Matrix4().fromArray(matrix);
      var l = new THREE.Matrix4()
          .makeTranslation(
            modelTransform.translateX,
            modelTransform.translateY,
            modelTransform.translateZ
          )
          .scale(
            new THREE.Vector3(
              modelTransform.scale,
              modelTransform.scale,
              modelTransform.scale
            )
          )
          .multiply(rotationX)
          .multiply(rotationY)
          .multiply(rotationZ);

      this.camera.projectionMatrix = m.multiply(l);
      // this.camera.updateProjectionMatrix();
      this.renderer.state.reset();
      this.renderer.render(this.scene, this.camera);
      this.map.triggerRepaint();
    }
  };
  return customLayer

}

export default {
  addObjectLayer
}
