# three.xr.js
Extra classes to make it work WebXR API with three.js

## Running the examples
<a href="https://docs.npmjs.com/getting-started/installing-node">Install npm</a> and then run the following:

```
$ npm install
$ npm start
```

## Supported browsers

  - ARKit: Mozilla's [ARKit based iOS app](https://github.com/mozilla/webxr-ios)
  - ARCore: Google's [WebARonARCore Android app](https://github.com/google-ar/WebARonARCore)


## Script

You need to have loaded:
```html
<script src='three.js'></script>
<script src='webxr-polyfill.js'></script>
<script src='three.xr.js'></script>
```

And after that, to use a script like this:
```js
THREE.WebXRUtils.getDisplays().then(init);

function init(displays) {
  xrDisplays = displays;

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera();
  scene.add( camera );

  renderer = new THREE.WebGLRenderer( { alpha: true } );
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.autoClear = false;
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  // Add custom code here

  window.addEventListener( 'resize', onWindowResize, false );
  onWindowResize();

  // Init WebXR
  xr = new THREE.WebXRManager(xrDisplays, renderer, camera, scene, update);
  xr.startSession( false, true );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
// Called once per frame, before render, to give the app a chance to update this.scene
function update(frame) {

}
```