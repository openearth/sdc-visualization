import * as THREE from 'three/build/three.module.js'
import {VTKLoader} from 'three/examples/jsm/loaders/VTKLoader.js'
import mapboxgl from 'mapbox-gl'


function addObjectLayer(map, id, url, color) {

  // metadata
  let metadata = {
    "variable":"Temperature",
    "var_min": 4.347969532,
    "var_max":17.7820949554,
    "percentiles":[6.0,8.0,10.0,12.0,14.0,16.0],
    "x_min":-1029705.2898377805,
    "x_max":4063161.4139544852,
    "y_min":3503549.8435043739,
    "y_max":5780349.2202563509,
    "z_min":-5500.0,
    "z_max":0.0,
    "lat_min":30.0,
    "lat_max":46.0,
    "lon_min":-9.25,
    "lon_max":36.5,
    "paths": [
      "polydata-Temperature-0000.ply",
      "polydata-Temperature-0001.ply",
      "polydata-Temperature-0002.ply",
      "polydata-Temperature-0003.ply",
      "polydata-Temperature-0004.ply",
      "polydata-Temperature-0005.ply"
    ]
  }

  // parameters to ensure the model is georeferenced correctly on the map
  var multiplyZ = 0.000005

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
  console.log(modelTransform)

  // configuration of the custom layer for a 3D model per the CustomLayerInterface
  var customLayer = {
    id: id,
    type: 'custom',
    renderingMode: '3d',
    onAdd: function(map, gl) {
      this.camera = new THREE.PerspectiveCamera();
      this.camera.far = 8000;
      this.camera.near = 0.001
      this.scene = new THREE.Scene();

      // create two three.js lights to illuminate the model
      var directionalLight = new THREE.DirectionalLight(0xffffff);
      directionalLight.position.set(0.5, 0.1, 0.1).normalize();
      directionalLight.castShadow = true;
      this.scene.add(directionalLight);

      var directionalLight2 = new THREE.DirectionalLight(0xffffff);
      directionalLight2.position.set(0.5, 0.5, 0.1).normalize();
      directionalLight2.castShadow = true;
      this.scene.add(directionalLight2);


      // const floor = new THREE.Mesh(
      //   new THREE.PlaneBufferGeometry(50, 50),
      //   new THREE.MeshPhongMaterial({
      //     color: "white"
      //   })
      // );

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

          var material = new THREE.MeshPhysicalMaterial({
            color: color,
            flatShading: false,
            transparency: 0.6,
            metalness: 0.1,
            roughness: 0.8,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
            transparent: true,
            emissive: 0x202929,
            opacity: 1
          });
          var mesh = new THREE.Mesh(geometry, material);
          mesh.doubleSided = false;

          // mesh.rotation.z = Math.PI;

          this.scene.add(mesh);
          mesh.scale.z = multiplyZ;
          mesh.translateZ(0.005)
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          window.mesh = mesh
        }.bind(this)
      );

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
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
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
