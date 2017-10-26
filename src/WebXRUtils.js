
THREE.WebXRUtils = {
	getDisplays: () => new Promise((resolve, reject) => {
		if(!navigator.XR){
			console.log('WebXR polyfill is not found');
			resolve(null);
			return;
		}else{
			navigator.XR.getDisplays().then(displays => {
				if(displays.length == 0) {
					console.log('No displays are available');
					resolve(null);
					return;
				}
				resolve(displays);
				return;
			}).catch(err => {
				console.error('Error getting XR displays', err);
				resolve(null);
				return;
			});
		}
	})
};

export default THREE.WebXRUtils;