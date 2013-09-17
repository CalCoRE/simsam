window.initSim = (function(){

    /* Create a new fabric.Canvas object that wraps around the original <canvas>
     * DOM element.
     */
    console.log("in simlite.js");
    canvas = new fabric.Canvas('container');
    
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
                console.log(getD(initState, endState));
                selectedObject.addTransform(getD(initState, endState));
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