// variables for cropping tool
var canvas, ctx, image, theSelection;
var iMouseX, iMouseY = 1;

var cropFrames = []; //cropped elements in order
var cropFrameRegistry = {}; //cropped elements by id

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
    this.csizeh = 10; //resize corner cubes size on hover

    this.bHow = [false, false, false, false]; //hover statuses
    this.iCSize = [this.csize, this.csize, this.csize, this.csize]; //corner sizes
    this.bDrag = [false, false, false, false]; //drag statuses
    this.bDragAll = false; //drag whole selection status
}

// main drawScene function
function drawScene() {
    // code from http://www.script-tutorials.com/html5-image-crop-tool/ 

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); //clear canvas
    
    //draw source image
    ctx.drawImage(image, 0, 0, ctx.canvas.width, ctx.canvas.height);

    //make source image darker for outside crop box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    //draw selection
    theSelection.draw();
}

function deleteRect() {
    //delete the cropping rectangle on the canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    //draw the image
    ctx.drawImage(image, 0, 0, ctx.canvas.width, ctx.canvas.height);

    //unbind mousemove event
    $('#canvas').unbind('mousemove');
}


function rescanCropThumbnails() {
      if (window.debug) {
	  console.log("rescanCropThumbnails");
      }
      cropFrames = [];
      $("#crop_output *").each(function(index, thumbnail) {
	  var frameId;
	  frameId = $(thumbnail).attr("data-frame-id");
	  cropFrames.push(cropFrameRegistry[frameId]);
	  return $(thumbnail).unbind("click").click(function() {
	      pause();
	      clearPlayback();
	      cameraOn();
	      placeFrame(index, overlayClass);
	      window.playbackIndex = index;
	      return updateIndexView();
	  });
	});
        return updateIndexView();
}
function saveCropCanvas(canvas, tempId) {
    var ajaxOptions, done, imageString, imageStringRaw;
    imageStringRaw = canvas.toDataURL("image/jpeg");
    imageString = imageStringRaw.replace("data:image/jpeg;base64,", "");
    ajaxOptions = {
      url: "save_frame",
      type: "POST",
      data: {
        image_string: imageString,
	image_directory: "sitestatic/media/cropped_frames/"
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
        return $("#crop_output canvas[data-frame-id='" + tempId + "']").attr("data-frame-id", response.id);
      }
    };
    return $.ajax(ajaxOptions).done(done);
}


function getResults() {
    // get results of crop
    // code adapted from http://www.script-tutorials.com/html5-image-crop-tool/

    var temp_ctx, temp_canvas;

    temp_canvas = document.createElement('canvas');
    temp_ctx = temp_canvas.getContext('2d');

    temp_canvas.width = theSelection.w;
    temp_canvas.height = theSelection.h;

    temp_ctx.drawImage(image, theSelection.x, theSelection.y, theSelection.w, theSelection.h, 0, 0, theSelection.w, theSelection.h); //draw the cropped image

    var vData = temp_canvas.toDataURL();
    $('#crop_result').attr('src', vData); //display result
    deleteRect(); //delete cropping rectangle from canvas

    var frame, frameId, frameIndex, frameOrdinal, crop_output, thumbnail;

    crop_output = $("#crop_output").get(0); //get the newly cropped image

    frameOrdinal = cropFrames.push(temp_canvas);

    frameId = frameIndex = frameOrdinal - 1; //get cropped frame id
    $(temp_canvas).attr("data-frame-id", frameId);
   
    var imageObj = new Image();
    imageObj.src = vData;

    //when double-clicking on crop in drawer, add cropped image to sim stage
    temp_canvas.addEventListener('dblclick', function(){
        var obj = new Kinetic.Image({
		image: imageObj,
		draggable: true,
		startScale: 1
	});
	var objLayer = new Kinetic.Layer();
	objLayer.add(obj);
	stage.add(objLayer);
    });

    cropFrameRegistry[frameId] = temp_canvas; //add to cropped elements by id

    crop_output.appendChild(temp_canvas); //display in drawer
    $("#crop_output").sortable("refresh"); 

    saveCropCanvas(temp_canvas, frameId); //save the cropped image
   
}

// define Selection draw method
Selection.prototype.draw = function() {
    // code from http://www.script-tutorials.com/html5-image-crop-tool/

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.w, this.h);

    //draw part of the original image
    if (this.w > 0 && this.h > 0) {
	ctx.drawImage(image, this.x, this.y, this.w, this.h, this.x, this.y, this.w, this.h);
    }

    //draw the resize corner cubes
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x - this.iCSize[0], this.y - this.iCSize[0], this.iCSize[0] * 2, this.iCSize[0] * 2);
    ctx.fillRect(this.x + this.w - this.iCSize[1], this.y - this.iCSize[1], this.iCSize[1] * 2, this.iCSize[1] * 2);
    ctx.fillRect(this.x + this.w - this.iCSize[2], this.y + this.h - this.iCSize[2], this.iCSize[2] * 2, this.iCSize[2] * 2);
    ctx.fillRect(this.x - this.iCSize[3], this.y + this.h - this.iCSize[3], this.iCSize[3] * 2, this.iCSize[3] * 2);
}

function cropCanvas() { 
      // code from http://www.script-tutorials.com/html5-image-crop-tool/
      canvas = document.getElementById('canvas');
      ctx = canvas.getContext('2d');
      image = new Image();
      image.onload = function() {
      }
      image.src = canvas.toDataURL();
      theSelection = new Selection(200, 200, 200, 200);
            
      $('#canvas').bind('mousemove', function(e) { // binding mouse move event
	  var canvasOffset = $(canvas).offset();
	  iMouseX = Math.floor(e.pageX - canvasOffset.left);
	  iMouseY = Math.floor(e.pageY - canvasOffset.top);

	  // in case of drag of whole selector
	  if (theSelection.bDragAll) {
	      theSelection.x = iMouseX - theSelection.px;
	      theSelection.y = iMouseY - theSelection.py;
	  }
	  for (i = 0; i < 4; i++) {
	      theSelection.bHow[i] = false;
	      theSelection.iCSize[i] = theSelection.csize;
          }
		
	  // hovering over resize cubes
	  if (iMouseX > theSelection.x - theSelection.csizeh && iMouseX < theSelection.x + theSelection.csizeh && iMouseY > theSelection.y - theSelection.csizeh && iMouseY < theSelection.y + theSelection.csizeh) {
	      theSelection.bHow[0] = true;
	      theSelection.iCSize[0] = theSelection.csizeh;
	  }
	  if (iMouseX > theSelection.x + theSelection.w - theSelection.csizeh && iMouseX < theSelection.x + theSelection.w + theSelection.csizeh && iMouseY > theSelection.y - theSelection.csizeh && iMouseY < theSelection.y + theSelection.csizeh) {
	      theSelection.bHow[1] = true;
	      theSelection.iCSize[1] = theSelection.csizeh;
	  }
	  if (iMouseX > theSelection.x + theSelection.w-theSelection.csizeh && iMouseX < theSelection.x + theSelection.w + theSelection.csizeh && iMouseY > theSelection.y + theSelection.h-theSelection.csizeh && iMouseY < theSelection.y + theSelection.h + theSelection.csizeh) {
	      theSelection.bHow[2] = true;
	      theSelection.iCSize[2] = theSelection.csizeh;
       	  }
	  if (iMouseX > theSelection.x - theSelection.csizeh && iMouseX < theSelection.x + theSelection.csizeh && iMouseY > theSelection.y + theSelection.h-theSelection.csizeh && iMouseY < theSelection.y + theSelection.h + theSelection.csizeh) {
	      theSelection.bHow[3] = true;
	      theSelection.iCSize[3] = theSelection.csizeh;
	  }

	  // in case of dragging resize cubes
	  var iFW, iFH;
	  if (theSelection.bDrag[0]) {
	      var iFX = iMouseX - theSelection.px;
	      var iFY = iMouseY - theSelection.py;
	      iFW = theSelection.w + theSelection.x - iFX;
	      iFH = theSelection.h + theSelection.y - iFY;
	  }
	  if (theSelection.bDrag[1]) {
	      var iFX = theSelection.x;
	      var iFY = iMouseY - theSelection.py;
	      iFW = iMouseX - theSelection.px - iFX;
	      iFH = theSelection.h + theSelection.y - iFY;
	  }
	  if (theSelection.bDrag[2]) {
	      var iFX = theSelection.x;
	      var iFY = theSelection.y;
	      iFW = iMouseX - theSelection.px - iFX;
	      iFH = iMouseY - theSelection.py - iFY;
	  }
	  if (theSelection.bDrag[3]) {
	      var iFX = iMouseX - theSelection.px;
	      var iFY = theSelection.y;
   	      iFW = theSelection.w + theSelection.x - iFX;
	      iFH = iMouseY - theSelection.py - iFY;
	  }

	  if (iFW > theSelection.csizeh * 2 && iFH > theSelection.csizeh * 2) {
	      theSelection.w = iFW;
	      theSelection.h = iFH;
		    
	      theSelection.x = iFX;
	      theSelection.y = iFY;
	  }
		
	  drawScene();
      });

      $('#canvas').mousedown(function(e) { // binding mousedown event
	  var canvasOffset = $(canvas).offset();
	  iMouseX = Math.floor(e.pageX - canvasOffset.left);
	  iMouseY = Math.floor(e.pageY - canvasOffset.top);
		
	  theSelection.px = iMouseX - theSelection.x;
	  theSelection.py = iMouseY - theSelection.y;

	  if (theSelection.bHow[0]){
	      theSelection.px = iMouseX - theSelection.x;
	      theSelection.py = iMouseY - theSelection.y;
	  }
	  if (theSelection.bHow[1]){
	      theSelection.px = iMouseX - theSelection.x - theSelection.w;
	      theSelection.py = iMouseY - theSelection.y;
	  }
	  if (theSelection.bHow[2]){
	      theSelection.px = iMouseX - theSelection.x - theSelection.w;
	      theSelection.py = iMouseY - theSelection.y - theSelection.h;
	  }
	   if (theSelection.bHow[3]){
	      theSelection.px = iMouseX - theSelection.x;
	      theSelection.py = iMouseY - theSelection.y - theSelection.h;
	  }

  	  if (iMouseX > theSelection.x + theSelection.csizeh && iMouseX < theSelection.x+theSelection.w - theSelection.csizeh && iMouseY > theSelection.y + theSelection.csizeh && iMouseY < theSelection.y+theSelection.h - theSelection.csizeh) 		  {
	      theSelection.bDragAll = true;
	  }
		
	  for (i = 0; i < 4; i++) {
	      if (theSelection.bHow[i]) {
	  	  theSelection.bDrag[i] = true;
	      }
	  }
      });
	    
      $('#canvas').mouseup(function(e) { // binding mouseup event
  	  theSelection.bDragAll = false;
		
	  for (i = 0; i < 4; i++) {
	      theSelection.bDrag[i] = false;
	  }
	  theSelection.px = 0;
	  theSelection.py = 0;
      });
      drawScene();
  };
