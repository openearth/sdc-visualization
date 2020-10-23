import * as THREE from 'three/build/three.module.js'
import {VTKLoader} from 'three/examples/jsm/loaders/VTKLoader.js'
import mapboxgl from 'mapbox-gl'

function addObjectLayer(map, id, url, color, metadata) {
  // todo, use metadata properly

  // parameters to ensure the model is georeferenced correctly on the map
  var multiplyZ = 0.000001

  var modelOrigin = [0, 0] // metadata.lon_min, metadata.lat_min]
  // modelOrigin = [0.5, 0.5]
  var modelAltitude = 300;
  var modelRotate = [0, 0, 0];

  var modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
    modelOrigin,
    modelAltitude
  );
  var modelScale = modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()

  modelScale = 1

  // transformation parameters to position, rotate and scale the 3D model onto the map
  var modelTransform = {
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
      this.camera.far = 1;
      this.camera.near = 0.0001
      this.scene = new THREE.Scene();


      // TODO: replace by more appealing light (this one doesn't  cast shadows)
      // const sky = 0xffffff
      // const ground = 0xB97A20
      // var hemiLight = new THREE.HemisphereLight(sky, ground, 0.1);
      // hemiLight.castShadow = true
      // this.scene.add(hemiLight);
      // hemiLight.position.set( 0.29277777671813965, 0.1, 0.3821312487125397 );


      // x - EW (0, 0) -> 0.5, 0.5
      // y - NS (0, 0) ->  0.5, 0.5
      // z - depth  (0.1) very high
      // hemiLight.position.set( 0.5, 0.2, 0.01 );
      // this.scene.add( hemiLight );

      // let hemiLightHelper = new THREE.HemisphereLightHelper( hemiLight, 0.01 );
      // this.scene.add( hemiLightHelper );

      // var sphereGeometry = new THREE.SphereBufferGeometry( 0.001, 32, 32);
      // var sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
      // var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
      // sphere.position.set(0.5, 0.35, 0.001)
      // sphere.castShadow = true; //default is false
      // sphere.receiveShadow = true; //default
      // this.scene.add( sphere )



      // TODO: add a floor to cast shadows
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
            transparency: 0.6,
            // metalness: 0.1,
            // roughness: 0.8,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
            transparent: true,
            emissive: 0x333333,
            opacity: 0.5
          });
          // var meshMaterial = new THREE.MeshStandardMaterial( { color: color } );

          var mesh = new THREE.Mesh(geometry, meshMaterial);
          // mesh.doubleSided = false;

          // mesh.rotation.z = Math.PI;

          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.scale.z = multiplyZ;

          this.scene.add(mesh);
          // mesh.translateZ(0.005)
          window.mesh = mesh
        }.bind(this)
      )


      // TODO: focusss

      var target = new THREE.Object3D()
      target.position.set(0.5, 0.5, 0)
      target.scale.z = multiplyZ;
      this.scene.add(target)


      var directionalLight = new THREE.DirectionalLight( 0xFFFFFF, 20 );
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
