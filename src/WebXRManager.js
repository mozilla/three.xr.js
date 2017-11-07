
THREE.WebXRManager = function (xrDisplays, renderer, camera, scene, updateCallback){
	this.renderer = renderer;
	this.camera = camera;
	this.scene = scene;

	var scope = this;
	var boundHandleFrame = handleFrame.bind(this); // Useful for setting up the requestAnimationFrame callback
	var boundHandleFrameDeactivate = handleFrameDeactivate.bind(this);

	var frameData = null;

	var displays = xrDisplays;

	var requestedFloor = false;
	var floorGroup = new THREE.Group();

	var devicePixelRatio = window.devicePixelRatio;

	// an array of info that we'll use in _handleFrame to update the nodes using anchors
	var anchoredNodes = [] // { XRAnchorOffset, Three.js Object3D }

	// Start a session per device connected
	this.sessions = [];

	this.session = null;

	this.supportedRealities = {
		vr: false,
		ar: false
	}

	this.addSession = function (display, reality) {
		var createVirtualReality = false;
		if(reality === 'vr'){
			createVirtualReality = true;
		}
		var sessionInitParamers = {
			exclusive: createVirtualReality,
			type: createVirtualReality ? XRSession.REALITY : XRSession.AUGMENTATION
		}

		display.requestSession(sessionInitParamers).then(session => {
			if(!createVirtualReality){
				if(display._reality._arKitWrapper){
					display.supportedAR = 'ARKit';
				}else if(display._reality._vrDisplay){
					display.supportedAR = 'ARCore';
				}
			}

			session.realityType = reality;
			session.depthNear = 0.05;
			session.depthFar = 1000.0;

			// Handle session lifecycle events
			session.addEventListener('focus', ev => { this.handleSessionFocus(ev) })
			session.addEventListener('blur', ev => { this.handleSessionBlur(ev) })
			session.addEventListener('end', ev => { this.handleSessionEnded(ev) })

			this.sessions.push (session);

			this.dispatchEvent({type: 'sessionAdded', session});

		}).catch(err => {
			console.error('Error requesting session', err);
		});
	};

	for(var displayObj of displays){
		if(displayObj.supportedRealities.vr){
			this.supportedRealities.vr = true;
			this.addSession(displayObj, 'vr');
		}
		if(displayObj.supportedRealities.ar){
			// Discard Flat screen from desktop and Android that doesn't support ARCore
			if(!displayObj._reality._vrDisplay && isMobileDevice() && !isAppleWebView()) {
				displayObj.supportedRealities.ar = false;
			}else{
				this.supportedRealities.ar = true;
				this.addSession(displayObj, 'ar');
			}
		}
	}

	function isAppleWebView() {
		return navigator.userAgent.indexOf('AppleWebKit') && navigator.userAgent.indexOf('Safari') === -1;
	};

	function isMobileDevice() {
		return (typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1);
	};

	function handleFrameDeactivate(frame){
		// Do nothing
	}

	function handleFrame(frame){
		if(this.renderer.xr.sessionActive) {
			this.session.requestFrame(boundHandleFrame);
		}else{
			this.session.requestFrame(boundHandleFrameDeactivate);
		}
		const headPose = frame.getDisplayPose(frame.getCoordinateSystem(XRCoordinateSystem.HEAD_MODEL));

		// If we haven't already, request the floor anchor offset
		if(requestedFloor === false){
			requestedFloor = true;
			frame.findFloorAnchor('first-floor-anchor').then(anchorOffset => {
				if(anchorOffset === null){
					console.error('could not find the floor anchor');
					return;
				}
				this.addAnchoredNode(anchorOffset, floorGroup);
			}).catch(err => {
				console.error('error finding the floor anchor', err)
			});
		}

		// Update anchored node positions in the scene graph
		for(let anchoredNode of anchoredNodes){
			this.updateNodeFromAnchorOffset(frame, anchoredNode.node, anchoredNode.anchorOffset)
		}

		// Let the extending class update the scene before each render
		this.updateScene(updateCallback, frame);

		// Prep THREE.js for the render of each XRView
		this.renderer.autoClear = false;
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.clear();

		if(this.renderer.xr.sessionActive) {
			// Render each view into this.session.baseLayer.context
			// for(const view of frame.views){
			for (var i = 0; i < frame.views.length; i++) {
				var view = frame.views[i];
				this.camera.projectionMatrix.fromArray(view.projectionMatrix);
				if(this.camera.parent && this.camera.parent.type !== 'Scene'){
					this.camera.parent.matrixAutoUpdate = false;
					this.camera.parent.matrix.fromArray(headPose.poseModelMatrix);
					this.camera.parent.updateMatrixWorld(true);
				}else{
					this.camera.matrixAutoUpdate = false;
					// Each XRView has its own projection matrix, so set the camera to use that
					this.camera.matrix.fromArray(headPose.poseModelMatrix);
					this.camera.updateMatrixWorld(true);
				}
	
				// Set up the renderer to the XRView's viewport and then render
				this.renderer.clearDepth();
				const viewport = view.getViewport(this.session.baseLayer);
				this.renderer.setViewport(viewport.x / devicePixelRatio, viewport.y / devicePixelRatio, viewport.width / devicePixelRatio, viewport.height / devicePixelRatio);
				if(frame.views.length === 1){
					this.camera.updateProjectionMatrix();
				}
				this.doRender();
			}
		}else{
			if(this.camera.parent && this.camera.parent.type !== 'Scene'){
				this.camera.parent.matrixAutoUpdate = false;
				this.camera.parent.matrix = new THREE.Matrix4();
				this.camera.parent.updateMatrixWorld(true);
			}else{
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

	this.activateSession = function (display, reality) {
		for(var session of this.sessions){
			if(session._display === display && session.realityType === reality){
				// Set the session's base layer into which the app will render
				session.baseLayer = new XRWebGLLayer(session, renderer.context);
				// Handle layer focus events
				session.baseLayer.addEventListener('focus', ev => { this.handleLayerFocus(ev) });
				session.baseLayer.addEventListener('blur', ev => { this.handleLayerBlur(ev) });

				this.session = session;
			}
		}

		if(this.session === null){
			console.error('Can not start presenting without a session');
			throw new Error('Can not start presenting without a session');
		}

		if(!this.renderer.xr.sessionActive){
			// this.requestId = this.session.requestFrame(boundHandleFrame);
			this.session.requestFrame(boundHandleFrame);
			this.renderer.xr.sessionActive = true;
			document.getElementsByClassName('webxr-realities')[0].style.display = 'block';
		}
	};

	this.deactivateSession = function () {
		// Added this parameter until End session will be implemented on the WebXR-polyfill
		this.renderer.xr.sessionActive = false;

		if (this.session._display._vrDisplay && this.session._display.isPresenting) {
			this.session._display._vrDisplay.exitPresent();
		}
		document.getElementsByClassName('webxr-realities')[0].style.display = 'none';
		// this.session.cancelFrame(this.requestId);
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
	
	/*
	Extending classes that need to update the layer during each frame should override this method
	*/
	this.updateScene = function (updateCallback, frame){
		updateCallback(frame);
	}

	this.doRender = function () {
		this.renderer.render(this.scene, this.camera);
	}

	/*
	Add a node to the scene and keep its pose updated using the anchorOffset
	*/
	this.addAnchoredNode = function(anchorOffset, node){
		anchoredNodes.push({
			anchorOffset: anchorOffset,
			node: node
		})
		this.scene.add(node);
	}
	
	/*
	Get the anchor data from the frame and use it and the anchor offset to update the pose of the node, this must be an Object3D
	*/
	this.updateNodeFromAnchorOffset = function(frame, node, anchorOffset){
		const anchor = frame.getAnchor(anchorOffset.anchorUID)
		if(anchor === null){
			console.error('Unknown anchor uid', anchorOffset.anchorUID);
			return
		}

		node.matrixAutoUpdate = false;
		node.matrix.fromArray(anchorOffset.getOffsetTransform(anchor.coordinateSystem));
		node.updateMatrixWorld(true);
	}
};

THREE.WebXRManager.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.WebXRManager.prototype.constructor = THREE.WebXRManager;

export default THREE.WebXRManager;