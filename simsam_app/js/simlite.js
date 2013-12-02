window.initSim = (function(){

    /* Create a new fabric.Canvas object that wraps around the original <canvas>
     * DOM element.
     */
    console.log("in simlite.js");
    canvas = new fabric.Canvas('container');
	canvas.on({'object:modified': simObjectModified});
	canvas.on({'object:selected': simObjectSelected});
	canvas.on({'selection:cleared': simObjectCleared});
    
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
			if (selectedObject.stateRecording) {
				$('#modifying').show(250);
			} else {
				$('#modifying').hide(250);
			}
		}
    }
});

// Utility Functions
pointWithinElement = function(x, y, element) {

	x1 = $(element).position().left;
	y1 = $(element).position().top;
	x2 = $(element).outerWidth() + x1;
	y2 = $(element).outerHeight() + y1;

	if (x < x1 || x > x2) return false;
	if (y < y1 || y > y2) return false;

	return true;
}

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

simObjectSelected = function(options) {
	$('#selected').show(250);
}

simObjectCleared = function(options) {
	$('#selected').hide(250);
}


//
// django functions
//
djangoDeleteImage = function(image_hash) {
	$.ajax({
		url: 'delete_image',
		type: 'POST',
		data: {
			image_hash: image_hash
		},
	dataType: 'json'
	});
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

//
// User Interface for Modifying Objects
//
deleteImageInternal = function(messageInfo, onSuccess) {
	buttons = {};
	buttons[messageInfo.button] =  function() {
		if (onSuccess !== undefined) {
			onSuccess();
		}
		$(this).dialog('close');
	};
	buttons['Cancel'] = function() {
		$(this).dialog('close');
	};

	$('#message-text').text(messageInfo.message);
	$('#dialog-confirm').dialog({
		resizable: false,
		height: 240,
		modal: true,
		title: messageInfo.title,
		buttons: buttons,
		// We have to do this manually to use a variable as a key

	});
}

// Remove only the individual object
deleteImageSingle = function(obj) {
	messageInfo = {
		message: 'This item will be permanantly deleted.  Are you sure?',
		title: 'Delete this object?',
		button: 'Delete',
	};
	onSuccess = function() {
		obj.remove();
	}
	deleteImageInternal(messageInfo, onSuccess);
}

// Remove all instances of the image from the sim/screen only
deleteImageClass = function(spriteType, classImage) {

	messageInfo = {
		message: 'All items of this type will be permanantly deleted.  Are you sure?',
		title: 'Delete all objects of this type?',
		button: 'Delete All',
	};
	onSuccess = function() {
		canvas.forEachObject(function (iterObj) {
			if (iterObj.spriteType == spriteType) {
				iterObj.remove();
				delete iterObj;
			}
		});
		$(classImage).remove();
	}
	deleteImageInternal(messageInfo, onSuccess);
}

// Remove all iamges from the screen/sim and from the db and all animations
deleteImageFully = function(spriteType, classImage) {
	messageInfo = {
		message: 'This sprite and all instances will be permanently deleted. ' +
			'Are you sure?',
		title: 'Delete this image fully?',
		button: 'Delete All',
	};
	onSuccess = function() {
		canvas.forEachObject(function (iterObj) {
			if (iterObj.spriteType == spriteType) {
				iterObj.remove();
				delete iterObj;
			}
		});
		image_hash = $(classImage).attr('data-hash');
		$(classImage).remove();
		djangoDeleteImage(image_hash);
	}
	deleteImageInternal(messageInfo, onSuccess);
}

/* User Interface code for Sprite InteractionRule */
uiInteractionCB = null;

uiInteractionChoose = function(sprite, callback) {
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

// UI Setup for events
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

	$('#uise_del').click(function() {
        obj = canvas.getActiveObject();

		deleteImageSingle(obj);
	});

	$('#uise_delall').click(function() {
		obj = canvas.getActiveObject();
		deleteImageClass(obj.spriteType);
	});

});
