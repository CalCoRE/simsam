// getDistance from HTML5 example
function getDistance(touch1, touch2){
  var x1 = touch1.clientX;
  var x2 = touch2.clientX;
  var y1 = touch1.clientY;
  var y2 = touch2.clientY;

  return Math.sqrt(((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1)));
}

function getSlope(touch1, touch2){
  var x1 = touch1.clientX;
  var x2 = touch2.clientX;
  var y1 = touch1.clientY;
  var y2 = touch2.clientY;

  return ((y1 - y2) / (x1 - x2));
}

function updateInitials(shape){
	shape.i_x = shape.getX();
	shape.i_y = shape.getY();
	shape.i_r = shape.getRotation();
	shape.i_s = shape.getScale().x;
}

function clearInitials(shape){
	shape.i_x = undefined;
	shape.i_y = undefined;
	shape.i_r = undefined;
	shape.i_s = undefined;
}

var touchDevice = (typeof(window.ontouchstart) != 'undefined') ? true : false;
var detectDrag = touchDevice ? "touchmove" : "drag";
var detectDragEnd = touchDevice ? "touchend" : "dragend";
var detectDouble = touchDevice ? "dbltap" : "dblclick";
var detectClick = touchDevice ? "tap" : "click";

function makeMovable(layer){

	console.log("premakeMovabledrag");

  layer.on(detectDrag, function(evt){

  	rulesMoved = true;
    var touch1 = evt.touches[0];
    var touch2 = evt.touches[1];
    
    console.log("drag from simlite");
    
    if (touch1) {
        if (targetShape) {
    			// MOVE it!
            if (targetShape.lastX === undefined) { var Xtrans = 0; }
            else { var Xtrans = (touch1.clientX - targetShape.lastX); }
            if (targetShape.lastY === undefined) { var Ytrans = 0; }
            else { var Ytrans = (touch1.clientY - targetShape.lastY); }
            
            targetShape.move(Xtrans, Ytrans);
            
            targetShape.lastX = touch1.clientX;
            targetShape.lastY = touch1.clientY;
        }
    }
    
    if (touch1 && touch2) {
        if (targetShape) {
        		// ROTATE it!
            if (targetShape.lastSlope === undefined) { var rotation = 0; }
            else { 
            	var currentSlope = getSlope(touch1, touch2);
            	var rotation = Math.atan(
            										(currentSlope - targetShape.lastSlope) / 
            										(1 + targetShape.lastSlope * currentSlope)
            								 );
            }
            
            targetShape.rotate(rotation);
            
            targetShape.lastSlope = getSlope(touch1, touch2);
            
            // SCALE it!
            if (targetShape.startDistance === undefined) { targetShape.startDistance = getDistance(touch1, touch2); }
            else {
                var dist = getDistance(touch1, touch2);
                var newscale = (dist / targetShape.startDistance) * targetShape.startScale;
                targetShape.setScale(newscale, newscale);
            }
        }
    }
    
    layer.draw(); 
  });
  
	console.log("premakeMovabledragend");
	
  layer.on(detectDragEnd, function(){
  	
		
  	rulesMoved = true;
    if(targetShape) {
    	targetShape = undefined;
    }
  });

}


// eventually this should construct genericactiveSprites.
function addObject( image ) {
	console.log("making object" + image );
	
	var obj = new Kinetic.Image({
  	x: 100,
  	y: 100,
		image: image,
		offset: [image.width / 2, image.height / 2],
    // custom property
    startScale: 1,
    draggable: true
  });
  
	console.log("made object" + obj );
  

	obj.on(detectDouble, function(){

    this.moveToTop(); 
    if( this.getLayer() === simLayer ) {
    	console.log("simlayer, movetorules, updateinitials");
    	this.moveTo(rulesLayer);
    	updateInitials(this);
    } else {
    	console.log("else");
	    if (rulesMoved == true) {
    		console.log("rulesmoved");
	  		rulesMoved = false;
				
				this.r_x = this.getX() - this.i_x;
				this.r_y = this.getY() - this.i_y;
				this.r_s = this.getScale().x / this.i_s;
				this.r_r = this.getRotation() - this.i_r;
				
				this.setPosition(this.i_x, this.i_y);
				this.setScale(this.i_s);
				this.setRotation(this.i_r);
				
				clearInitials(this);
				
	    }
    	this.moveTo(simLayer);
    }
		rulesLayer.draw();
  });
  
  obj.on(detectClick, function(){
  
		// reset manip info
    this.lastX = undefined;
    this.lastY = undefined;
    this.lastSlope = undefined;
    this.startDistance = undefined;
    this.startScale = this.getScale().x;

    targetShape = this;
    this.moveToTop();
  });
  
  obj.on(detectDragEnd, function() {
		rulesMoved = true;
	});
	  	  
  simLayer.add(obj);
  activeSprites.push(obj);
	rulesLayer.draw();
	simLayer.draw();

}

// globals used in cropTool.js
var stage, shapes, simLayer, rulesLayer, activeSprites, rulesMoved;

window.onload = function(){	

	// =====================================================
	// ===================== STAGE =========================
	// =====================================================

	stage = new Kinetic.Stage({
	          container: "container",
	          width: 1000,
	          height: 800
	        });
	rulesMoved = false; 
	activeSprites = new Array();
	        
	//=============== RULES LAYER ===========================
	//=== This layer just exists to record manipulations ====
	//=== of a Node. No figures live here unless they =======
	//=== have been moved here by double tapping a node =====
	//=== that lives in the simulation space. This layer ====
	//=== records scaling, rotation, and translation vars ===
	//=== and stores them in the node that has been called ==
	//=======================================================
    
  rulesLayer = new Kinetic.Layer({opacity: .5});
  var targetShape = undefined;

	//makeMovable(rulesLayer);
	        
	//================= SIM LAYER ===========================
	//=== This layer shows current properties of obects  ====
	//=== and executes rules, if they have any. =============
	//=======================================================
  simLayer = new Kinetic.Layer();
 	//makeMovable(simLayer);  
  
	// ===================== SHAPES =========================
	// === This is the list of imported shapes. =============
	// ======================================================
  
	var img = new Image();
	img.src = "http://" + window.location.host + "/static/images/image.jpg";
	addObject(img)
	
	var img2 = new Image();
	img2.src = "http://" + window.location.host + "/static/images/clip.png";
	addObject(img2)
  
  // gobutton
  var grnsq = new Kinetic.RegularPolygon({
      x: 300,
      y: 300,
      sides: 4,
      radius: 80,
      fill: "green",
      stroke: "black",
      strokeWidth: 4
  });
  
	grnsq.on(detectClick, function(){
		console.log("grnsq on detectclick");
		for( i = 0 ; i < activeSprites.length ; i++ ){
			console.log("for shapes " + i);
			if(activeSprites[i].getLayer() === simLayer) {
				console.log("for sprite " + i);
				console.log("move " + activeSprites[i].r_x + " , " + activeSprites[i].r_y);
				activeSprites[i].move(activeSprites[i].r_x, activeSprites[i].r_y);
				//activeSprites[i].setScale(activeSprites[i].r_s * activeSprites[i].getScale().x);
				//activeSprites[i].rotate(activeSprites[i].r_r);
				simLayer.draw();
			}
  	}
  });
  
  simLayer.add(grnsq);
 
	//=============== ADD LAYERS TO STAGE ===================
  
  stage.add(simLayer);
  stage.add(rulesLayer);
};
