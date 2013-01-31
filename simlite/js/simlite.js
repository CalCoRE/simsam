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

var stage;


window.onload = function(){	

// =====================================================
// ===================== STAGE =========================
// =====================================================

	stage = new Kinetic.Stage({
	          container: "container",
	          width: 800,
	          height: 400
	        });
	var output = document.getElementById("output");
	var rulesMoved = false; 
	        
//=============== RULES LAYER ===========================
//=== This layer just exists to record manipulations ====
//=== of a Node. No figures live here unless they =======
//=== have been moved here by double tapping a node =====
//=== that lives in the simulation space. This layer ====
//=== records scaling, rotation, and translation vars ===
//=== and stores them in the node that has been called ==
//=======================================================
    
  var rulesLayer = new Kinetic.Layer({opacity: .5});
  var targetShape = undefined;

  rulesLayer.on("touchmove", function(evt){
  	rulesMoved = true;
    var touch1 = evt.touches[0];
    var touch2 = evt.touches[1];
    
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
            	var rotation = Math.atan((currentSlope - targetShape.lastSlope) / (1 + targetShape.lastSlope * currentSlope));
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
    
    rulesLayer.draw(); 
  });

  rulesLayer.on("touchend", function(){
  	
    if(targetShape) {
    	targetShape = undefined;
    }
  });
	        
//================= SIM LAYER ===========================
//=== This layer shows current properties of obects  ====
//=== and executes rules, if they have any. =============
//=======================================================
  var simLayer = new Kinetic.Layer();
  
  simLayer.on("touchmove", function(evt){
    var touch1 = evt.touches[0];
    var touch2 = evt.touches[1];
    
    
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
            	var rotation = Math.atan((currentSlope - targetShape.lastSlope) / (1 + targetShape.lastSlope * currentSlope));
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
    
    simLayer.on("touchend", function(){
      if (targetShape) {
          targetShape = undefined;
      }
  	});
    
    simLayer.draw(); 
  });
  
  
// ===================== SHAPES =========================
// === This is the list of imported shapes. =============
// ======================================================
  
	var img = new Image();
	var img2 = new Image();
	img.src = "http://" + window.location.host + "/static/images/image.jpg";
	img2.src = "http://" + window.location.host + "/static/images/clip.png";
	shapes = new Array(img, img2); // eventually this will be constructed dynamically
	sprites = new Array();
	
	  for( i = 0; i < shapes.length ; i++ ) {
	  var obj = new Kinetic.Image({
	  	x: 100,
	  	y: 100,
  		image: shapes[i],
  		offset: [shapes[i].width / 2, shapes[i].height / 2],
      // custom property
      startScale: 1
	  });

		obj.on("dbltap", function(){
  
	    this.moveToTop(); 
	    if( this.getLayer() === simLayer ) {
	    	this.moveTo(rulesLayer);
	    	updateInitials(this);
				rulesLayer.draw();
	    } else {
		    if (rulesMoved == true) {
		  		rulesMoved = false;
					this.r_x = this.getX() - this.i_x;
					this.r_y = this.getY() - this.i_y;
					this.r_s = this.getScale().x / this.i_s;
					this.r_r = this.getRotation() - this.i_r;
					
		    	output.innerHTML = this.r_x + ", " 
		    									 + this.r_y + ", " 
		    									 + this.r_s + ", "
		    									 + this.r_r + "<br>"
		    									 + output.innerHTML;
					
					this.setPosition(this.i_x, this.i_y);
					this.setScale(this.i_s);
					this.setRotation(this.i_r);
					
					clearInitials(this);
					
		    }
	    	this.moveTo(simLayer);
				rulesLayer.draw();
	    	simLayer.draw();
	    }
	  });
	  
	  obj.on("touchstart", function(){
	  
			// reset manip info
	    this.lastX = undefined;
	    this.lastY = undefined;
	    this.lastSlope = undefined;
	    this.startDistance = undefined;
	    this.startScale = this.getScale().x;
	
	    targetShape = this;
	    this.moveToTop();
	  });
	  
	  simLayer.add(obj);
	  
	  sprites.push(obj);
  }
  
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
  
	grnsq.on("tap", function(){
		for( i = 0 ; i < shapes.length ; i++ ){
			if(sprites[i].getLayer() === simLayer) {
				sprites[i].move(sprites[i].r_x, sprites[i].r_y);
				sprites[i].setScale(sprites[i].r_s * sprites[i].getScale().x);
				sprites[i].rotate(sprites[i].r_r);
				simLayer.draw();
			}
  	}
  });
  
  simLayer.add(grnsq);
 
//=============== ADD LAYERS TO STAGE ===================
  
  stage.add(simLayer);
  stage.add(rulesLayer);
};
