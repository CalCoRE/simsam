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
			selectedObject.learningToggle();
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

// Called every time a sim object has finished moving so we can see if it
// is interacting, etc.
simObjectModified = function(options) {
	if (options.target) {
		target = options.target;
		if (!target.hasOwnProperty('stateRecording') || 
				!target.stateRecording) {
			console.log("Our target isn't being edited");
			return;
		}
		intersetObj = null;
		// Don't think we need to assert SIM mode b/c we trigger 'modified'
		// If we're in recording mode and we are dropped on another object,
		//   then begin the creation of an interaction rule.
		canvas.forEachObject(function(obj) {
			if (obj === target) return;
			if (obj.trueIntersectsWithObject(target)) {
				if (typeof(target.interactionEvent) != "undefined") {
					// XXX Now add a UI and add the interactionEvent after
					// the user selects which type of action to take
					target.interactionEvent(obj);
				}
			}
		});
	}
}

/* User Interface code for Sprite InteractionRule */
uiInteractionCB = null;

uiInteractionChoose = function(sprite, callback) {
	console.log('uiInteractionChoose');
	uiInteractionCB = callback;
	posLeft = sprite.getLeft();
	width = sprite.getWidth();
	posTop = sprite.getTop();
	height = sprite.getHeight();
	// Right now we're using centered positions.  Adjust.
	posLeft += width / 2 + 15; // +15 padding
	posTop -= height;
	$('#interactions').css("top", posTop);
	$('#interactions').css("left", posLeft);
	$('#interactions').show();
}

$(document).ready(function() {
	interMap = { 'uich_trans': 'transpose',
		'uich_clone': 'clone',
		'uich_delete': 'delete',
	};
	$('.uich').click(function () {
		$('.simui').hide();
		action = interMap[$(this).attr('id')];
		if (action === undefined) {
			console.log('Error: You have included a UI element with no action');
			return false;
		}
		uiInteractionCB(action);
		return false;
	});

});
