# three.xr.js

[![Version](http://img.shields.io/npm/v/three.xr.js.svg?style=flat-square)](https://npmjs.org/package/three.xr.js)
[![License](http://img.shields.io/npm/l/three.xr.js.svg?style=flat-square)](https://npmjs.org/package/three.xr.js)

Library to build [WebXR](https://github.com/mozilla/webxr-api) experiences with [three.js](https://github.com/mrdoob/three.js)

## Running the examples
<a href="https://docs.npmjs.com/getting-started/installing-node">Install npm</a> and then run the following:

```
$ npm install
$ npm start
```

## Supported browsers

### AR

  - ARKit: Mozilla's [ARKit based iOS app](https://github.com/mozilla/webxr-ios)
  - ARCore: Google's [WebARonARCore Android app](https://github.com/google-ar/WebARonARCore)

### VR

  - Daydream: [Chrome for Android](https://webvr.rocks/chrome_for_android)
  - Gear VR: [Oculus Browser](https://webvr.rocks/oculus_browser)
  - HTC Vive / Oculus Rift: [Firefox](https://webvr.rocks/firefox)
  - Windows Mixed Reality: [Microsoft Edge](https://webvr.rocks/microsoft_edge)

## Usage

Include three.xr.js after THREE.js:
```html
<script src='three.js'></script>
<script src='three.xr.js'></script>
```

In your application code you can do:
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

  // Only for AR (start an AR session that is presenting automatically)
  xr.startSession( false, true );

  // Only for VR (start an VR session that is NOT presenting automatically)
  xr.startSession( true, false );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
// Called once per frame, before render, to give the app a chance to update this.scene
function update(frame) {

}

// Only for VR (Add this into a click event of a 'enter VR' button)
renderer.xr.startPresenting();
```