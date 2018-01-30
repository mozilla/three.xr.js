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
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera();
  scene.add( camera );

  renderer = new THREE.WebGLRenderer( { alpha: true } );
  renderer.autoClear = false;
  container.appendChild( renderer.domElement );

  // Add custom code here

  window.addEventListener( 'resize', onWindowResize, false );
  onWindowResize();

  // Set XR options
  var options = {
    // Flag to start AR if is the unique display available.
    AR_AUTOSTART: false, // Default: true
  }
  // Init WebXR
  renderer.xr = new THREE.WebXRManager(options, displays, renderer, camera, scene, update);

  // Listen when a session is started or stopped
  renderer.xr.addEventListener('sessionStarted', sessionStarted);
  renderer.xr.addEventListener('sessionEnded', sessionEnded);

  // Auto start if only has one AR display supported
  if(!renderer.xr.autoStarted){
    // Add as many buttons as there are displays that can be started
    addEnterButtons(displays);
  }

  renderer.animate(render);
}

function sessionStarted(data) {
  activeRealityType = data.session.realityType;
  // We can show or hide elements depending on the active reality type
  // ar, magicWindow, vr
}

function sessionEnded(data) {
  activeRealityType = 'magicWindow';
  // We can show or hide elements depending on the active reality type
  // ar, magicWindow, vr
}

function addEnterButtons(displays) {
  for (var i = 0; i < displays.length; i++) {
    var display = displays[i];
    if(display.supportedRealities.vr){
      // Add ENTER VR button
      // and to call enterVR on 'click' event
    }
    if(display.supportedRealities.ar){
      // Add ENTER AR button
      // and to call enterVR on 'click' event
    }
  }
}

function enterAR(){
  renderer.xr.startSession(display, 'ar', true);
}

function exitAR(){
  renderer.xr.endSession();
}

function enterVR(){
  renderer.xr.startPresenting();
}

// To detect and exitVR
window.addEventListener('vrdisplaypresentchange', (evt) => {
  // Polyfill places cameraActivateddisplay inside the detail property
  var display = evt.display || evt.detail.display;
  if (!display.isPresenting) {
    // Exiting VR.
    renderer.xr.endSession();
  }
});

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

// Called once per frame, before render, to give the app a chance to update this.scene
function update(frame) {
  render();
}

function render() {
  // We can different commands depending on the active reality type
  // ar, magicWindow, vr
  switch (activeRealityType) {
    case 'ar':
    case 'magicWindow':
    case 'vr':
      
      break;
  } 

  // Only renderer.render out of renderer.xr if the session is not active
  if(!renderer.xr.sessionActive){
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.render(this.scene, this.camera);
  }
}

```