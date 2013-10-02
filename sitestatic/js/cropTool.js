// variables for cropping tool
var canvas, thisctx, image, theSelection;
var iMouseX, iMouseY = 1;

var cropFrames = []; //cropped elements in order
var cropFrameRegistry = {}; //cropped elements by id


function aspectAdjust(canvas, object) {
	widthAdjust = canvas.clientWidth / canvas.width;
	heightAdjust = canvas.clientHeight / canvas.height;
	backwardRatioX = canvas.width / canvas.clientWidth;
	backwardRatioY = canvas.height / canvas.clientHeight;
  	console.log(widthAdjust, heightAdjust);
	
	return [	object.x * widthAdjust , 
			object.y * heightAdjust , 
			object.w * widthAdjust , 
			object.h * heightAdjust , 
			backwardRatioX,
			backwardRatioY	]
}

// define Selection constructor
function Selection(x, y, w, h) {
	// code from http://www.script-tutorials.com/html5-image-crop-tool/
	
	//initial positions
	this.x = x;
	this.y = y;
	//initial size
	this.w = w;
	this.h = h;
	//extra variables for dragging calculations
	this.px = x;
	this.py = y;
	
	this.csize = 6; //resize corner cubes size
	this.csizeh = 20; //resize corner cubes size on hover
	
	this.bHow = [false, false, false, false]; //hover statuses
	this.iCSize = [this.csize, this.csize, this.csize, this.csize]; //corner sizes
	this.bDrag = [false, false, false, false]; //drag statuses
	this.bDragAll = false; //drag whole selection status
}

// main drawScene function
function drawScene() {
  
 	console.log("drawScene");
	// code from http://www.script-tutorials.com/html5-image-crop-tool/ 
	
	thisctx.clearRect(0, 0, thisctx.canvas.width, thisctx.canvas.height); //clear canvas
	
	//draw source image
	thisctx.drawImage(image, 0, 0, thisctx.canvas.width, thisctx.canvas.height);
	
	//make source image darker for outside crop box
	thisctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
	thisctx.fillRect(0, 0, thisctx.canvas.width, thisctx.canvas.height);
 	console.log(thisctx);
	
	//draw selection
	theSelection.draw();
}

function deleteRect() {
	//delete the cropping rectangle on the canvas
	thisctx.clearRect(0, 0, thisctx.canvas.width, thisctx.canvas.height);
	
	//draw the image
	thisctx.drawImage(image, 0, 0, thisctx.canvas.width, thisctx.canvas.height);
	
	//unbind mousemove event
	//canvas.click(screenClick());

        showStartCroppingButton();
}


function rescanCropThumbnails() {
  if (window.debug) {
	  console.log("rescanCropThumbnails");
  }
  cropFrames = [];
  $("#sprite_drawer *").each(function(index, thumbnail) {
		var frameId;
	  frameId = $(thumbnail).attr("data-frame-id");
	  cropFrames.push(cropFrameRegistry[frameId])
  });
}


function saveCropCanvas(canvas, tempId) {
	var ajaxOptions, done, imageString, imageStringRaw;
	imageStringRaw = canvas.toDataURL("image/jpeg");
	imageString = imageStringRaw.replace("data:image/jpeg;base64,", "");
	ajaxOptions = {
		url: "save_image",
		type: "POST",
		data: {
			image_string: imageString,
			image_type: "Sprite",
			animation_id: window.animationId
		},
		dataType: "json"
	};
	
	done = function(response) {
		var frame;
		console.log("save canvas ajax response", response);
		if (response.success) {
			frame = cropFrameRegistry[tempId];
			delete cropFrameRegistry[tempId];
			cropFrameRegistry[response.id] = frame;
			$(frame).attr("data-frame-id", response.id);
			return $("#sprite_drawer canvas[data-frame-id='" + tempId + "']").attr("data-frame-id", response.id);
		}
	};
	
	return $.ajax(ajaxOptions).done(done);
}


function getResults() {
    // get results of crop
    // code adapted from http://www.script-tutorials.com/html5-image-crop-tool/
    // exit crop

    var temp_ctx, temp_canvas;

    temp_canvas = document.createElement('canvas');
    temp_ctx = temp_canvas.getContext('2d');

    temp_canvas.width = theSelection.w;
    temp_canvas.height = theSelection.h;

    temp_ctx.drawImage( image, 
 			theSelection.x, 
    		        theSelection.y, 
    			theSelection.w, 
    			theSelection.h, 
    			0, 0, 
    			theSelection.w, 
    			theSelection.h); //draw the cropped image

    var vData = temp_canvas.toDataURL();
    $('#crop_result').attr('src', vData); //display result
    deleteRect(); //delete cropping rectangle from canvas

    var frame, frameId, frameIndex, frameOrdinal, sprite_drawer, thumbnail;

    sprite_drawer = $("#sprite_drawer").get(0); //get the newly cropped image

    frameOrdinal = cropFrames.push(temp_canvas);

    frameId = frameIndex = frameOrdinal - 1; //get cropped frame id
    $(temp_canvas).attr("data-frame-id", frameId);
   
    var imageObj = new Image();
    imageObj.src = vData;

    cropFrameRegistry[frameId] = temp_canvas; //add to cropped elements by id

    sprite_drawer.appendChild(temp_canvas); //display in drawer
    $("#sprite_drawer").sortable("refresh");

    saveCropCanvas(temp_canvas, frameId); //save the cropped image

    showStartCroppingButton();

}

// define Selection draw method
Selection.prototype.draw = function() {
  // code from http://www.script-tutorials.com/html5-image-crop-tool/

  thisctx.strokeStyle = '#fff';
  thisctx.lineWidth = 2;
  thisctx.strokeRect(this.x, this.y, this.w, this.h);

  //draw part of the original image
  if (this.w > 0 && this.h > 0) {
		thisctx.drawImage(image, this.x, this.y, this.w, this.h, this.x, this.y, this.w, this.h);
  }

  //draw the resize corner cubes
  thisctx.fillStyle = '#fff';
  /*ctx.fillRect(this.x - this.iCSize[0], 
  						 this.y - this.iCSize[0], 
  						 this.iCSize[0] * 2, 
  						 this.iCSize[0] * 2);*/
  /*ctx.fillRect(this.x + this.w - this.iCSize[1], 
  						 this.y - this.iCSize[1], 
  						 this.iCSize[1] * 2, 
  						 this.iCSize[1] * 2);*/
  thisctx.fillRect(this.x + this.w - this.iCSize[2], 
  						 this.y + this.h - this.iCSize[2], 
  						 this.iCSize[2] * 3, 
  						 this.iCSize[2] * 3);
  /*ctx.fillRect(this.x - this.iCSize[3], 
  						 this.y + this.h - this.iCSize[3], 
  						 this.iCSize[3] * 2, 
  						 this.iCSize[3] * 2);*/
}

function cropCanvas() { 
  // code from http://www.script-tutorials.com/html5-image-crop-tool/
  /// mhwj heavily edited to work on touch devices, lots of comments below
  
  // before
  //canvas = document.getElementById('canvas');
  //

  hideStartCroppingButton();

  window.switchToPlaybackMode();
  
  canvas = $(".playback-frame").get(0);
  
  thisctx = canvas.getContext('2d');
  image = new Image();
  image.onload = function() {};
  image.src = canvas.toDataURL();
  theSelection = new Selection(200, 200, 200, 200);
  
  $(".playback-frame").unbind('click');
  
  Hammer(canvas).on("dragstart", function(e) { // binding mousedown event
  
        console.log("dragstart from cropCanvas");
      
        //e.preventDefault(); // this prevents the mobile browsers from treating 
      										// this touch event like they would otherwise and scrolling the screen around
        e.gesture.preventDefault();
        //e.gesture.stopPropogation();
    
        var intxn = e.gesture.touches[0];
      										
	var canvasOffset = $(canvas).offset();
	iMouseX = Math.floor(intxn.pageX - canvasOffset.left);
	iMouseY = Math.floor(intxn.pageY - canvasOffset.top);
		
		
        adjustedSelection = aspectAdjust(canvas,theSelection);
        adjustedX = adjustedSelection[0];
        adjustedY = adjustedSelection[1];
        adjustedW = adjustedSelection[2];
        adjustedH = adjustedSelection[3];
		
	theSelection.px = iMouseX - adjustedX;
	theSelection.py = iMouseY - adjustedY;
		  
  	console.log("mouse " , iMouseX , iMouseY );
  	console.log("offset " , canvasOffset );
  	console.log("selection ", theSelection );
  	console.log("adjustedselection ", aspectAdjust(canvas,theSelection) );
	
		// hovering over resize cubes
	  /*if (iMouseX > adjustedX - theSelection.csizeh && 
  	  	iMouseX < adjustedX + theSelection.csizeh && 
  	  	iMouseY > adjustedY - theSelection.csizeh && 
  	  	iMouseY < adjustedY + theSelection.csizeh) {
      theSelection.bDrag[0] = true;
      theSelection.px = iMouseX - adjustedX;
      theSelection.py = iMouseY - adjustedY;
	  }*/
	  /*if (iMouseX > adjustedX + adjustedW - theSelection.csizeh && 
      	iMouseX < adjustedX + adjustedW + theSelection.csizeh && 
      	iMouseY > adjustedY - theSelection.csizeh && 
      	iMouseY < adjustedY + theSelection.csizeh) {
      theSelection.bDrag[1] = true;
      theSelection.px = iMouseX - adjustedX - adjustedW;
      theSelection.py = iMouseY - adjustedY;
	  }*/
	if (iMouseX > adjustedX + adjustedW - theSelection.csizeh && 
      	    iMouseX < adjustedX + adjustedW + theSelection.csizeh && 
      	    iMouseY > adjustedY + adjustedH - theSelection.csizeh && 
      	    iMouseY < adjustedY + adjustedH + theSelection.csizeh) {

                    theSelection.bDrag[2] = true;
                    theSelection.px = iMouseX - adjustedX - adjustedW;
                    theSelection.py = iMouseY - adjustedY - adjustedH;
        }
	  /*if (iMouseX > adjustedX - theSelection.csizeh && 
      	iMouseX < adjustedX + theSelection.csizeh && 
      	iMouseY > adjustedY + adjustedH - theSelection.csizeh && 
      	iMouseY < adjustedY + adjustedH + theSelection.csizeh) {
      theSelection.bDrag[3] = true;
	    theSelection.px = iMouseX - adjustedX;
	    theSelection.py = iMouseY - adjustedY - adjustedH;
		}*/

  	if (iMouseX > adjustedX + theSelection.csizeh && 
	    iMouseX < adjustedX + adjustedW - theSelection.csizeh && 
	    iMouseY > adjustedY + theSelection.csizeh && 
	    iMouseY < adjustedY + adjustedH - theSelection.csizeh) {

                    theSelection.bDragAll = true;
	}
		
  });
        
  //$('#canvas').bind(drag, function(e) { // binding mouse move event. Using 'smart' drag var to determine mobile or not
  Hammer(canvas).on("drag", function(e) {
  
        console.log("drag from cropCanvas");
  	
        e.gesture.preventDefault();
    
        adjustedSelection = aspectAdjust(canvas,theSelection);
        adjustedX = adjustedSelection[0];
	adjustedY = adjustedSelection[1];
	adjustedW = adjustedSelection[2];
	adjustedH = adjustedSelection[3];
	backwardX = adjustedSelection[4]; 
	backwardY = adjustedSelection[5];
    
        var intxn = e.gesture.touches[0];
    
	var canvasOffset = $(canvas).offset();
	  
	//alert(touch.pageX);
	  
	// mouse events store info in pageX and pageY, but touch events store info in an array
	iMouseX = Math.floor(intxn.pageX - canvasOffset.left);
	iMouseY = Math.floor(intxn.pageY - canvasOffset.top);

	// in case of drag of whole selector
  	console.log(theSelection.bDragAll);
	if (theSelection.bDragAll) {
  		console.log("drag whole selector");
                theSelection.x = iMouseX * backwardX - theSelection.px;
                theSelection.y = iMouseY * backwardY - theSelection.py;
	}
	for (i = 0; i < 4; i++) {
                theSelection.bHow[i] = false;
                theSelection.iCSize[i] = theSelection.csize;
        }

	// in case of dragging resize cubes
	var iFW, iFH;
	if (theSelection.bDrag[0]) {
                var iFX = iMouseX * backwardX - theSelection.px;
                var iFY = iMouseY * backwardY - theSelection.py;
                iFW = adjustedW + adjustedX - iFX;
                iFH = adjustedH + adjustedY - iFY;
	}
	if (theSelection.bDrag[1]) {
                var iFX = theSelection.x;
                var iFY = iMouseY * backwardY - theSelection.py;
                iFW = iMouseX - theSelection.px - iFX;
                iFH = adjustedH + adjustedY - iFY;
	}
	if (theSelection.bDrag[2]) {
                var iFX = theSelection.x;
                var iFY = theSelection.y;
                iFW = iMouseX * backwardX - theSelection.px - iFX;
                iFH = iMouseY * backwardY - theSelection.py - iFY;
	}
	if (theSelection.bDrag[3]) {
                var iFX = iMouseX * backwardX - theSelection.px;
                var iFY = theSelection.y;
 	        iFW = adjustedW + adjustedX - iFX;
                iFH = iMouseY * backwardY - theSelection.py - iFY;
	}

	if (iFW > theSelection.csizeh * 2 && iFH > theSelection.csizeh * 2) {
	        theSelection.w = iFW;
	        theSelection.h = iFH;
	        theSelection.x = iFX;
	        theSelection.y = iFY;
	}
		
        drawScene();
  });

	    
  Hammer(canvas).on("dragend", function(e) { // binding mouseup event
  
  	console.log("dragend from cropCanvas");
  	
        e.gesture.preventDefault();
    
        theSelection.bDragAll = false;
		
	for (i = 0; i < 4; i++) {
	      theSelection.bDrag[i] = false;
	}
	theSelection.px = 0;
	theSelection.py = 0;
  });
  
  //$("#canvas").click(screenClick());
  
  drawScene();

};

function hideStartCroppingButton() {
  //display save crop and cancel crop buttons
  $('#savecrop').show();
  $('#cancelcrop').show();
  //hide the start cropping button
  $('#startcropping').hide();
};
function showStartCroppingButton() {
  //display start cropping button
  $('#startcropping').show();
  //hide save crop and cancel crop buttons
  $('#savecrop').hide();
  $('#cancelcrop').hide();
};
