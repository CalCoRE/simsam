window.initSim = (function(){

    /* Create a new fabric.Canvas object that wraps around the original <canvas>
     * DOM element.
     */
    console.log("in simlite.js");
    canvas = new fabric.Canvas('container');
	canvas.on({'object:modified': simObjectModified});
    
    //HACK - this should be something like css' max-height = 100% etc.
    // maybe not possible because resizing after setting stretches the canvas img.
    canvas.setHeight(1000);
    canvas.setWidth(1000);
    
    recording = [];
    initState = {};
    endState = {};
    
    // listen for a doubleclick. 
    fabric.util.addListener(fabric.document, 'dblclick', toggleRecord);
    function toggleRecord(ev) {
		// Assert we're at least clicking on the canvas
		loc = canvas.getPointer(ev);
		width = canvas.getWidth();
		height = canvas.getHeight();
		if (loc.x > width || loc.y > height) return;
		console.log('toggleRecord');
        selectedObject = canvas.getActiveObject();
        if( selectedObject !== null ) { // if one object is selected this fires
            if( recording !== selectedObject ) {
                initState = getObjectState(selectedObject);
                console.log(initState);
                selectedObject.showLearning();
                recording = selectedObject;
            } else {
                endState = getObjectState(selectedObject);
                console.log(endState);
                selectedObject.showNormal();
                console.log(getD(initState, endState) + ' stype: ' + selectedObject.spriteType);
				r = new Rule(selectedObject.spriteType);
				r.setActionType('transform');
                r.addTransform(initState, endState);
				selectedObject.addRule(r);
                //selectedObject.addTransform(getD(initState, endState), initState, endState);
                recording = [];
            }
        }
    }
});

getObjectState = function(object) {
    return {
        width: object.getWidth(),
        height: object.getHeight(),
        left: object.getLeft(),
        top: object.getTop(),
        angle: object.getAngle()
    }
}

getD = function(init , end) {
    return {
        //dxScale: end.width / init.width,
        dxScale: end.width - init.width,
        //dyScale: end.height / init.height,
        dyScale: end.height - init.height,
        dx: end.left - init.left,
        dy: end.top - init.top,
        dr: end.angle - init.angle
    }
}

simObjectModified = function(options) {
	if (options.target) {
		target = options.target;
		intersetObj = null;
		// Don't think we need to assert SIM mode b/c we trigger 'modified'
		// Maybe also assert that we're in recording mode
		canvas.forEachObject(function(obj) {
			if (obj === target) return;
			if (obj.intersectsWithObject(target)) {
				if (typeof(target.interactionEvent) != "undefined") {
					target.interactionEvent(obj);
				}
			}
		});
	}
}
