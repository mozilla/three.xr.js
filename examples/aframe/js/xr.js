AFRAME.registerComponent('xr', {
  schema: {
    reality: { default: 'ar' }
  },
  init: function () {
    this.posePosition = new THREE.Vector3();
    this.poseQuaternion = new THREE.Quaternion();
    this.poseEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.poseRotation = new THREE.Vector3();
    this.poseIsLost = true;

    var self = this;
    document.querySelector('a-scene').addEventListener('loaded', function () {
      self.wrapScene();
    })

    if (this.el.sceneEl.camera) {
      this.cameraActivated();
    } else {
      this.el.sceneEl.addEventListener('camera-set-active', function (evt) {
        self.cameraActivated();
      });
    }
  },
  wrapScene: function () {
    this.el.sceneEl.enterVR = function () {
      console.log('----enterVR_wrap');
    };
  },
  cameraActivated: function () {
    this.defaultPosition = new THREE.Vector3(0, 1.6, 0.1);
    this.el.sceneEl.camera.el.setAttribute('position', this.defaultPosition);

    if (this.data.reality !== 'vr') {
      this.el.sceneEl.setAttribute('vr-mode-ui', {enabled: false});
    }

    this.updateFrame = this.updateFrame.bind(this);

    var self = this;
    THREE.WebXRUtils.getDisplays().then(self.xrConnected.bind(self));
  },

  xrConnected: function (displays) {
    this.el.sceneEl.renderer.autoClear = false;

    // To show camera on iOS devices
    document.documentElement.style.backgroundColor = 'transparent';
    document.body.style.backgroundColor = 'transparent';
    this.xr = new THREE.WebXRManager(displays, this.el.sceneEl.renderer, this.el.sceneEl.camera, this.el.sceneEl.object3D, this.updateFrame);
    this.el.sceneEl.renderer.xr = this.xr;
    if (this.data.reality === 'vr') {
      this.xr.startSession(true, false);
    } else {
      this.xr.startSession(false, true);
    }
  },
  updateFrame: function (frame) {
    // Custom code for each frame rendered
  }
});
