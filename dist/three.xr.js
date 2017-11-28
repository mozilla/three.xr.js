/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebXRUtils = exports.WebXRManager = undefined;

var _WebXRManager = __webpack_require__(1);

var _WebXRManager2 = _interopRequireDefault(_WebXRManager);

var _WebXRUtils = __webpack_require__(2);

var _WebXRUtils2 = _interopRequireDefault(_WebXRUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// require('../vendor/webxr-polyfill');

exports.WebXRManager = _WebXRManager2.default;
exports.WebXRUtils = _WebXRUtils2.default;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
THREE.WebXRManager = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var displays = arguments[1];
  var renderer = arguments[2];
  var camera = arguments[3];
  var scene = arguments[4];
  var updateCallback = arguments[5];

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

  var devicePixelRatio = window.devicePixelRatio;

  // A provisional hack until XRSession end method works
  this.sessions = [];

  this.session = null;

  this.autoStarted = false;

  this.poseFound = false;
  function handleFrame(frame) {
    if (this.sessionActive) {
      this.session.requestFrame(boundHandleFrame);
    }
    var headPose = frame.getDisplayPose(frame.getCoordinateSystem(XRCoordinateSystem.HEAD_MODEL));

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
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.clear();

    if (this.sessionActive) {
      // Render each view into this.session.baseLayer.context
      // for(const view of frame.views) {
      for (var i = 0; i < frame.views.length; i++) {
        var view = frame.views[i];
        this.camera.projectionMatrix.fromArray(view.projectionMatrix);
        if (this.camera.parent && this.camera.parent.type !== 'Scene') {
          this.camera.parent.matrixAutoUpdate = false;
          this.camera.parent.matrix.fromArray(headPose.poseModelMatrix);
          this.camera.parent.updateMatrixWorld(true);
        } else {
          this.camera.matrixAutoUpdate = false;
          // Each XRView has its own projection matrix, so set the camera to use that
          this.camera.matrix.fromArray(headPose.poseModelMatrix);
          this.camera.updateMatrixWorld(true);
        }

        // Set up the renderer to the XRView's viewport and then render
        this.renderer.clearDepth();
        var viewport = view.getViewport(this.session.baseLayer);
        this.renderer.setViewport(viewport.x / devicePixelRatio, viewport.y / devicePixelRatio, viewport.width / devicePixelRatio, viewport.height / devicePixelRatio);
        this.doRender();
      }
    } else {
      if (this.camera.parent && this.camera.parent.type !== 'Scene') {
        this.camera.parent.matrixAutoUpdate = false;
        this.camera.parent.matrix = new THREE.Matrix4();
        this.camera.parent.updateMatrixWorld(true);
      } else {
        // this.camera.matrixAutoUpdate = false;
        // // Each XRView has its own projection matrix, so set the camera to use that
        // this.camera.projectionMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        this.camera.matrix = new THREE.Matrix4();
        this.camera.updateMatrixWorld(true);
      }

      // Set up the renderer to the XRView's viewport and then render
      this.renderer.clearDepth();
      this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
      this.doRender();
    }
  }

  this.startSession = function (display, reality) {
    var _this = this;

    var createVirtualReality = false;
    if (reality === 'vr') {
      createVirtualReality = true;
    }
    var sessionInitParamers = {
      exclusive: createVirtualReality,
      type: createVirtualReality ? XRSession.REALITY : XRSession.AUGMENTATION
    };
    if (this.sessionActive) {
      return;
    }
    if (this.session !== null) {
      this.session.end();
      this.session = null;
    }
    // If the session is not created yet
    display.requestSession(sessionInitParamers).then(function (session) {
      session.realityType = reality;
      session.depthNear = 0.05;
      session.depthFar = 1000.0;

      // Handle session lifecycle events
      session.addEventListener('focus', function (ev) {
        _this.handleSessionFocus(ev);
      });
      session.addEventListener('blur', function (ev) {
        _this.handleSessionBlur(ev);
      });
      session.addEventListener('end', function (ev) {
        _this.handleSessionEnded(ev);
      });

      renderer.domElement.style.width = '';
      renderer.domElement.style.height = '';
      // Set the session's base layer into which the app will render
      session.baseLayer = new XRWebGLLayer(session, renderer.context);
      // Handle layer focus events
      session.baseLayer.addEventListener('focus', function (ev) {
        _this.handleLayerFocus(ev);
      });
      session.baseLayer.addEventListener('blur', function (ev) {
        _this.handleLayerBlur(ev);
      });

      session.requestFrame(boundHandleFrame);

      _this.sessions.push(session);
      _this.session = session;
      _this.sessionActive = true;
      // document.getElementsByClassName('webxr-realities')[0].style.display = 'block';
      _this.dispatchEvent({ type: 'sessionStarted', session: session });
    }).catch(function (err) {
      console.error('Error requesting session', err);
    });
  };

  this.endSession = function () {
    this.session.end();
    this.dispatchEvent({ type: 'sessionEnded', session: this.session });
    this.sessionActive = false;
    if (this.session._display._vrDisplay && this.session._display.isPresenting) {
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
  this.totalSupportedDisplays = 0;

  for (var i = 0; i < this.displays.length; i++) {
    var display = this.displays[i];
    if (display.supportedRealities.vr) {
      vrSupportedDisplays++;
    }
    if (display.supportedRealities.ar) {
      displayToAutoStart = display;
      arSupportedDisplays++;
    }
  }
  if (arSupportedDisplays === 1 && vrSupportedDisplays === 0 && this.options.AR_AUTOSTART) {
    this.autoStarted = true;
    this.startSession(displayToAutoStart, 'ar');
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

exports.default = THREE.WebXRManager;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
THREE.WebXRUtils = {
  getDisplays: function getDisplays() {
    return new Promise(function (resolve, reject) {
      if (!navigator.XR) {
        console.log('WebXR polyfill is not found');
        resolve(null);
      } else {
        navigator.XR.getDisplays().then(function (displays) {
          if (displays.length === 0) {
            console.log('No displays are available');
            resolve(null);
            return;
          }

          var ARParamers = {
            exclusive: false,
            type: XRSession.AUGMENTATION
          };
          var VRParamers = {
            exclusive: true,
            type: XRSession.REALITY
          };

          var realities = {
            vr: false,
            ar: false
          };
          // Hack to receive WebVR 1.1 display info
          setTimeout(function () {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = displays[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var displayObj = _step.value;

                // Reinit realities
                realities = {
                  vr: false,
                  ar: false
                };
                if (displayObj.supportsSession(ARParamers)) {
                  if (!displayObj._reality._vrDisplay && isMobileDevice() && !isAppleWebView()) {
                    // Mobile browsers except WebARonARCore and iOS App XR app
                    realities.ar = false;
                  } else if (!isMobileDevice()) {
                    // Desktop browsers
                    realities.ar = false;
                  } else {
                    realities.ar = true;
                  }
                }
                if (displayObj.supportsSession(VRParamers) && displayObj._displayName.indexOf('polyfill') === -1) {
                  realities.vr = true;
                }
                displayObj.supportedRealities = realities;
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }

            resolve(displays);
          }, 1000);

          function isAppleWebView() {
            return navigator.userAgent.indexOf('AppleWebKit') && navigator.userAgent.indexOf('Safari') === -1;
          }

          function isMobileDevice() {
            return typeof window.orientation !== 'undefined' || navigator.userAgent.indexOf('IEMobile') !== -1;
          }
        }).catch(function (err) {
          console.error('Error getting XR displays', err);
          resolve(null);
        });
      }
    });
  }
};

exports.default = THREE.WebXRUtils;

/***/ })
/******/ ]);