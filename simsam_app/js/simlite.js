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
				if (selectedObject.isRandom()) {
					$('#uimod_rand').addClass('highlight');
					randomSliderShow(selectedObject);
				}
			} else {
				modifyingHide(selectedObject);
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
	currentSimObject = canvas.getActiveObject();
	$('#selected').show(250);
}

simObjectCleared = function(options) {
	$('#selected').hide(250);
	modifyingHide(currentSimObject);
	currentSimObject = null;
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

//
// Random Slider Handlers
//

randomDrawArc = function(ang) {
	rarc = $('#random-arc');
	width = $(rarc).attr('width');
	height = $(rarc).attr('height');
	ctx = $(rarc)[0].getContext('2d');
	ctx.clearRect(0,0, width, height);

	//pct = 80;
	lineWidth = 4;
	pm = (ang/180.1) * Math.PI; // extra .1 keeps arc a circle at 100%
	max = (Math.PI*1.5) + pm;
	max = max % (Math.PI*2);
	min = (Math.PI*1.5) - pm;
	radius = Math.max(width/2, height/2) - lineWidth / 2;
	ctx.moveTo(width/2, height/2);
	ctx.beginPath();
	ctx.strokeStyle = 'black';
	ctx.lineWidth = lineWidth;
	ctx.arc(width/2, height/2, radius, min, max, false);
	//ctx.arc(50, 50, 25, 0, Math.PI, false);
	ctx.lineTo(width/2, height/2);
	//ctx.lineTo(width/2 + radius * Math.cos(min), height/2 + radius * Math.sin(min));
	ctx.fill();
	ctx.stroke();
	ctx.closePath();

}

randomSliderPosition = function(obj) {
	leftPos = obj.getLeft();
	topPos = obj.getTop();
	width = obj.getWidth();
	height = obj.getHeight();
	sliderWidth = 150; // from CSS

	posEl = $('#random-range');

	// + width/2 if left-aligned object
	cpos = leftPos - sliderWidth/2;
	tpos = topPos - height - 60;
	if (tpos < 0) tpos = 0;
	$(posEl).css({ top: tpos, left: cpos });

	arcWidth = 150; // or = width
	arcHeight = 150; // or = height
	arcTop = topPos - height/2 - 40; // 40 is padding
	arcLeft = leftPos - arcWidth/2;
	arcObj = $('#random-ui');
	console.log('Setting width ' +width + ' height: ' + height);
	arcObj.width(arcWidth);
	arcObj.height(arcHeight);
	arcObj.css({left: arcLeft, top: arcTop});
	$('#random-arc').attr('width', arcWidth);
	$('#random-arc').attr('height', arcHeight);

	randomDrawArc(obj.randomRange);
}

// de-randomize (close, or randomize un-selected, etc.)
randomSliderRelease = function(obj) {
	if (obj && obj.savedAngle !== undefined) {
		obj.setAngle(obj.savedAngle);
		delete obj.savedAngle;
		canvas.renderAll();
	}
}

randomSliderShow = function(obj) {
	randomSliderPosition(obj);
	$('#random-range').show();
	console.log("randomRange: " + obj.randomRange);
	$('#randomslider').slider('value', obj.randomRange);
	$('#random-ui').show();
	randomDrawArc(obj.randomRange);
	obj.savedAngle = obj.getAngle();
	obj.setAngle(0);
	obj.setCoords();
	canvas.renderAll();
}

randomSliderHide = function(obj) {
	$('#random-range').hide();
	$('#random-ui').hide();
	randomSliderRelease(obj);
}

modifyingHide = function(p_obj) {
	var obj = p_obj;
	if (obj == null) {
		obj = canvas.getActiveObject();
	}
	$('#modifying').hide(250);
	$('#uimod_rand').removeClass('highlight');
	randomSliderHide(obj);
	// Clear recording if we're in the middle of it.
	if (obj.stateRecording) {
		// if we should abort recording, just clear stateRecording
		obj.learningToggle();
	}
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

	// Functions for UI when Selected
	$('#uise_del').click(function() {
        obj = canvas.getActiveObject();

		deleteImageSingle(obj);
	});

	$('#uise_delall').click(function() {
		obj = canvas.getActiveObject();
		deleteImageClass(obj.spriteType);
	});

	// Functions for UI when Modifying
	$('#uimod_rand').click(function() {
		obj = canvas.getActiveObject();
		if (!obj.isEditing) return;
		random = obj.isRandom();
		// Toggle the random value
		obj.setRandom(!random);

		if (obj.isRandom()) {
			$(this).addClass('highlight');
			randomSliderShow(obj);
		} else {
			$(this).removeClass('highlight');
			randomSliderHide(obj);
		}
	});

	$('#randomslider').slider({
		min: 0,
		max: 180,
		slide: function(ev, ui) {
			obj = canvas.getActiveObject();
			if (obj !== undefined) {
				obj.randomRange = ui.value;
			}
			randomDrawArc(ui.value); 
		},
	});

});
