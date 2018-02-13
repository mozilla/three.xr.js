THREE.WebXRManager = function (options = {}, displays, renderer, camera, scene, updateCallback) {
  // Default options
  var defaultOptions = {
    AR_AUTOSTART: true
  };
  this.options = Object.assign({}, defaultOptions, options);
  this.displays = displays;
  this.renderer = renderer;
  this.camera = camera;
  this.scene = scene;

  var boundHandleFrame = handleFrame.bind(this); // Useful for setting up the requestAnimationFrame callback

  // A provisional hack until XRSession end method works
  this.sessions = [];

  this.session = null;

  this.autoStarted = false;

  this.matrixWorldInverse = new THREE.Matrix4();

  this.poseFound = false;
  function handleFrame (frame) {
    if (this.sessionActive) {
      this.session.requestFrame(boundHandleFrame);
    }
    const headPose = frame.getDisplayPose(frame.getCoordinateSystem(XRCoordinateSystem.HEAD_MODEL));

    if (headPose._orientation[0] === 0 && headPose._orientation[1] === 0 && headPose._orientation[2] === 0 && headPose._orientation[3] === 1) {
      if (this.poseFound) {
        this.dispatchEvent({ type: 'poseLost' });
        this.poseFound = false;
      }
    } else {
      if (!this.poseFound) {
        this.dispatchEvent({ type: 'poseFound' });
        this.poseFound = true;
      }
    }

    // Let the extending class update the scene before each render
    this.updateScene(updateCallback, frame);

    // Prep THREE.js for the render of each XRView
    this.renderer.autoClear = false;
    this.renderer.setSize(this.session.baseLayer.framebufferWidth, this.session.baseLayer.framebufferHeight, false);
    this.renderer.clear();

    let poseTarget;
    if (this.camera.parent && this.camera.parent.type !== 'Scene') {
      poseTarget = this.camera.parent;
    } else {
      poseTarget = this.camera;
    }
    poseTarget.matrixAutoUpdate = false;
    poseTarget.matrix.fromArray(headPose.poseModelMatrix);
    poseTarget.matrix.decompose(poseTarget.position, poseTarget.quaternion, poseTarget.scale);
    poseTarget.updateMatrixWorld(true);

    if (this.sessionActive) {
      // Render each view into this.session.baseLayer.context
      for (var i = 0; i < frame.views.length; i++) {
        var view = frame.views[i];
        // Each XRView has its own projection matrix, so set the camera to use that
        this.camera.matrixWorldInverse.fromArray(view.viewMatrix);

        this.camera.projectionMatrix.fromArray(view.projectionMatrix);
        // Set up the renderer to the XRView's viewport and then render
        this.renderer.clearDepth();
        const viewport = view.getViewport(this.session.baseLayer);
        this.renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
        this.doRender();
      }
    } else {
      // Set up the renderer to the XRView's viewport and then render
      this.renderer.clearDepth();
      this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
      this.doRender();
    }

  }

  this.startSession = function (display, reality, autoPresenting) {
    var createVirtualReality = false;
    if (reality === 'vr') {
      createVirtualReality = true;
    }
    var sessionInitParamers = {
      exclusive: createVirtualReality,
      type: createVirtualReality ? XRSession.REALITY : XRSession.AUGMENTATION
    }
    if (this.sessionActive) {
      return;
    }
    if (this.session !== null) {
      this.session.end();
      this.session = null;
    }
    var self = this;
    // If the session is not created yet
    display.requestSession(sessionInitParamers).then(session => {
      this.session = session;
      session.realityType = reality;
      session.depthNear = 0.05;
      session.depthFar = 1000.0;

      // Handle session lifecycle events
      session.addEventListener('focus', ev => { this.handleSessionFocus(ev) })
      session.addEventListener('blur', ev => { this.handleSessionBlur(ev) })
      session.addEventListener('end', ev => { this.handleSessionEnded(ev) })

      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      if (reality === 'ar' && autoPresenting) {
        self.startPresenting();
      }
    }).catch(err => {
      console.error('Error requesting session', err);
    });
  };

  this.startPresenting = function () {
    // VR Mode
    if (displayVR && displayVR._vrDisplay) {
      renderer.vr.enabled = true;
      displayVR._vrDisplay.isPresenting ? displayVR._vrDisplay.exitPresent() : displayVR._vrDisplay.requestPresent([{source: this.renderer.domElement}]);
    } else {
    // AR Mode
      // Set the session's base layer into which the app will render
      this.session.baseLayer = new XRWebGLLayer(this.session, renderer.context);

      // Handle layer focus events
      this.session.baseLayer.addEventListener('focus', ev => { this.handleLayerFocus(ev) });
      this.session.baseLayer.addEventListener('blur', ev => { this.handleLayerBlur(ev) });

      this.session.requestFrame(boundHandleFrame);
      this.sessions.push(this.session);
      this.sessionActive = true;
    }

    this.dispatchEvent({ type: 'sessionStarted', session: this.session });
  };

  this.endSession = function () {
    this.session.end();
    this.dispatchEvent({ type: 'sessionEnded', session: this.session });
    this.sessionActive = false;
    if (this.session._display._vrDisplay && this.session._display.isPresenting) {
      renderer.vr.enabled = false;
      this.session._display._vrDisplay.exitPresent();
    }
    // document.getElementsByClassName('webxr-realities')[0].style.display = 'none';
  };

  this.handleSessionFocus = function (ev) {
    console.log('handleSessionFocus');
  };

  this.handleSessionBlur = function (ev) {
    console.log('handleSessionBlur');
  };

  this.handleSessionEnded = function (ev) {
    console.log('handleSessionEnded');
  };

  this.handleLayerFocus = function (ev) {
    console.log('handleLayerFocus');
  };

  this.handleLayerBlur = function (ev) {
    console.log('handleLayerBlur');
  };

  // Autostart an AR session if is the only one available
  var vrSupportedDisplays = 0;
  var arSupportedDisplays = 0;
  var displayToAutoStart;
  var displayVR;
  this.totalSupportedDisplays = 0;

  for (var i = 0; i < this.displays.length; i++) {
    var display = this.displays[i];
    if (display.supportedRealities.vr) {
      displayVR = display;
      this.renderer.vr.setDevice(displayVR._vrDisplay);
      vrSupportedDisplays++;
    }
    if (display.supportedRealities.ar) {
      displayToAutoStart = display;
      arSupportedDisplays++;
    }
  }
  // Start and presenting an AR session
  if (arSupportedDisplays === 1 && vrSupportedDisplays === 0 && this.options.AR_AUTOSTART) {
    this.autoStarted = true;
    this.startSession(displayToAutoStart, 'ar', true);
  }
  // Start and waiting to start presenting (by clicking a button) a VR session
  if (arSupportedDisplays === 0 && vrSupportedDisplays === 1) {
    this.startSession(displayVR, 'vr', false);
  }

  this.totalSupportedDisplays = arSupportedDisplays + vrSupportedDisplays;
  /*
  Extending classes that need to update the layer during each frame should override this method
  */
  this.updateScene = function (updateCallback, frame) {
    updateCallback(frame);
  };

  this.doRender = function () {
    this.renderer.render(this.scene, this.camera);
  };
};

THREE.WebXRManager.prototype = Object.create(THREE.EventDispatcher.prototype);
THREE.WebXRManager.prototype.constructor = THREE.WebXRManager;


export default THREE.WebXRManager;
