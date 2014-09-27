window.initSim = (function(){

    interactionWaiting = false;     // in state of having just dropped measure
    currentTracker = null;          // operating measure object
    currentSimObject = null;
    cloneObj = null;
    g_clickTime = 0;

    /* Create a new fabric.Canvas object that wraps around the original <canvas>
     * DOM element.
     */
    console.log("in simlite.js");
    canvas = new fabric.Canvas('container');
    canvas.on({'object:modified': simObjectModified});
    canvas.on({'object:selected': simObjectSelected});
    canvas.on({'selection:cleared': simObjectCleared});
    canvas.on({'mouse:down': simObjectClicked});
    canvas.on("after:render", function(){canvas.calcOffset();}); // for mouse offset issues
    window.globalPos = $('#construction_frame').offset();
    
    setCanvasSize($(this).width());
    
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

        // If double-click a text object
        if (selectedObject instanceof TextGroup) {
            textBeginEditing(selectedObject);
            return;
        }
        // if one object is selected this fires
        if (selectedObject !== null && selectedObject !== undefined) { 
            if (! (typeof selectedObject['learningToggle'] === 'function')) {
                return;
            }
            selectedObject.learningToggle();
            if (selectedObject.stateRecording) {
                selectedObject.bringToFront();
                modifyingShow(selectedObject);
                if (selectedObject.isRandom()) {
                    $('#uimod_rand').parent().addClass('highlight');
                    randomSliderShow(selectedObject);
                }
                if (selectedObject.isClone()) {
                    $('#uimod_clone').parent().addClass('highlight');
                }
                if (selectedObject.isSprout()){
                    $('#uimod_sprout').parent().addClass('highlight');
                }
            } else {
                modifyingHide(selectedObject);
            }
        }
    }
    window.load(); // when I first load the project, load any saved sim stuff
});

// dynamic canvas size based on browser window
setCanvasSize = function(width) {
    browserWidth = parseInt(width);
    if (width < 910) {
        canvas.setHeight(420);
        canvas.setWidth(555);
    } else if ((width >= 911) && (width < 1210)) {
        canvas.setHeight(400);
        canvas.setWidth(650);
    } else {
        canvas.setHeight(570);
        canvas.setWidth(950);
    }
}

// check and reset canvas size on resize
// eventually this should probably scale objects and behaviors too
$(window).resize(function() {
    setCanvasSize($(this).width());
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

// Borrowed from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
generateUUID = function() {
    var d = new Date().getTime(); // .now() doesn't work in Opera
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
            function(c) {
                var r = (d + Math.random() * 16) %16 | 0;
                d = Math.floor(d/16);
                return (c=='x' ? r : (r&0x7|0x8)).toString(16);
            });
    return uuid;
}

getObjectState = function(object) {
    retObj = {
        width: object.getWidth(),
        height: object.getHeight(),
        left: object.getLeft(),
        top: object.getTop(),
        angle: object.getAngle()
    }

    console.log ('top: ' + retObj.top + ' left: ' + retObj.left);
    return retObj;
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

// Mouse-down detection. Only used for 'close' button detection.
simObjectClicked = function(options) {
    if (options.target && options.e) {
        var e = options.e;
        var target = options.target;
        var clickTime = (new Date()).getTime();

        var adjustedX = e.layerX - target.getLeft();
        var adjustedY = e.layerY - target.getTop();

        var point = new fabric.Point(adjustedX, adjustedY);
        // N.B. If you stop in a debugger, this will always pass
        if (clickTime < (g_clickTime + 100)) {
            // If we were selected w/i last 100ms, it's the same click
            return;
        }

        if (currentSimObject instanceof TextGroup){
            currentSimObject.shouldClose(point);
        }
    }

}

// Handler for any object in Fabric.js that is selected (single clicked).
simObjectSelected = function(options) {
    if (typeof options.target.selected === 'function') {
        g_clickTime = (new Date()).getTime();
        options.target.selected();
    }
    if (cloneObj != null && canvas.getActiveObject() != cloneObj) {
        cloneWidgetHide();
        return;
    }
    // We're waiting for a select to occur on a measurement
    if (interactionWaiting) {
        currentTracker.targetSprite = canvas.getActiveObject();
        canvas.discardActiveObject(); interactionWaiting = false;
        $('#count_blocker').hide();
        return;
    }

    currentSimObject = canvas.getActiveObject();
    $('#selected').show(250);
}

simObjectCleared = function(options) {
    if (typeof currentSimObject.cleared === 'function') {
        currentSimObject.cleared();
    }
    if (cloneObj != null) {
        cloneWidgetHide();
        return;
    }
    $('#selected').hide(250);
    if (currentSimObject !== undefined) {
        modifyingHide(currentSimObject);
    }
    currentSimObject = null;
    save(); // when I have moved or programmed an object, auto-save it
}

// Called every time a sim object has finished moving so we can see if it
// is interacting, etc.
simObjectModified = function(options) {
    if (options.target) {
        target = options.target;

        if (typeof target.modified === 'function') {
            target.modified();
        }
        rec = target.hasOwnProperty('stateRecording') && target.stateRecording;
        tran = target.hasOwnProperty('stateTranspose') && target.stateTranspose;
        if (!rec & !tran) {
            console.log("Our target isn't being edited");
            return;
        }
        intersetObj = null;
        // Don't think we need to assert SIM mode b/c we trigger 'modified'
        // If we're in recording mode and we are dropped on another object,
        //   then begin the creation of an interaction rule.
        canvas.forEachObject(function(obj) {
            if (obj === target){
               console.log('obj === target. Line 155 simlite.js');  
                return;
            }
            if (typeof obj.trueIntersectsWithObject === 'function' &&
                obj.trueIntersectsWithObject(target)) {
                console.log('obj intersected.  Line 159 simlite.js');
                if (typeof(target.interactionEvent) != "undefined") {
                    console.log('interactionEvent not undefined.  Line 161 simlite.js');
                    // XXX Now add a UI and add the interactionEvent after
                    // the user selects which type of action to take
                    target.interactionEvent(obj);
                }
            }
        });
    }
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
        message: 'This item will be permanently deleted.  Are you sure?',
        title: 'Delete this object?',
        button: 'Delete',
    };
    onSuccess = function() {
        obj.removeFromList();
        obj.remove();
    }
    deleteImageInternal(messageInfo, onSuccess);
}

// Remove all instances of the image from the sim/screen only
deleteImageClass = function(spriteType, classImage) {

    messageInfo = {
        message: 'All items of this type will be permanently deleted.  Are you sure?',
        title: 'Delete all objects of this type?',
        button: 'Delete All',
    };
    onSuccess = function() {
        canvas.forEachObject(function (iterObj) {
            if (iterObj.spriteType == spriteType) {
                iterObj._count = 0;
                iterObj.removeFromList();
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
                iterObj.removeFromList();
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
    ctx.fillStyle = '#62c004';

    //pct = 80;
    lineWidth = 0;
    pm = (ang/180.1) * Math.PI; // extra .1 keeps arc a circle at 100%
    max = (Math.PI*1.5) + pm;
    max = max % (Math.PI*2);
    min = (Math.PI*1.5) - pm;
    radius = Math.max(width/2, height/2) - lineWidth / 2;
    ctx.moveTo(width/2, height/2);
    ctx.beginPath();
    ctx.strokeStyle = '#62c004';
    ctx.lineWidth = lineWidth;
    ctx.arc(width/2, height/2, radius, min, max, false);
    ctx.lineTo(width/2, height/2);
    //ctx.lineTo(width/2 + radius * Math.cos(min), height/2 + radius * Math.sin(min));
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

}

randomSliderPosition = function(obj) {
    var leftPos = obj.getLeft();
    var topPos = obj.getTop();
    var width = obj.getWidth();
    var height = obj.getHeight();
    var sliderWidth = 150; // from CSS
    var offset = window.globalPos;

    posEl = $('#random-range');

    // + width/2 if left-aligned object
    cpos = leftPos - sliderWidth/2 + offset.left;
    tpos = topPos - (106 + 150) + offset.top;
    if (tpos < offset.top) tpos = offset.top;
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

// Display the widget for setting random breadth
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
    if (obj == null) {
        obj = canvas.getActiveObject();
    }
    $('#random-range').hide();
    $('#random-ui').hide();
    randomSliderRelease(obj);
}

//
// Cloning functions
//
setCloneUILocation = function (clone) {
    console.log("setCloneUILocation");
    var cui = $('#clone-ui');
    var myWidth = $(cui).width();
    var myHeight = $(cui).outerHeight();
    var objHeight = clone.getHeight();
    var offset = $('#construction_frame').offset();
    $(cui).css({ 
        top: clone.getTop() - objHeight/2 - myHeight - 15 + offset.top,
        left: clone.getLeft() - myWidth/2 + offset.left,
    });
}

cloneWidgetShow = function(obj) {
    console.log("cloneWidgetShow");
    var x = obj.getLeft();
    var y = obj.getTop();

    var theta = obj.getAngle() * Math.PI / 180;
    var xo = 45;
    var yo = -45;
    var startX = x + xo * Math.cos(theta) - yo * Math.sin(theta);
    var startY = y + xo * Math.sin(theta) + yo * Math.cos(theta);

    var imgElement = document.createElement('img');
    imgElement.src = obj.getSrc();
    cloneObj = new fabric.Image(imgElement, {
        lockRotation: false,
        lockScalingX: true,
        lockScalingY: true,
        opacity: 0.7,
        top: startY,
        left: startX,
        cornerSize: 20,
        angle: obj.getAngle(),
    });
    cloneObj.myOriginalTop = startY;
    cloneObj.myOriginalLeft = startX;
    cloneObj.modified = function() {
        setCloneUILocation(this);
    }
    cloneObj.daddy = obj;
    canvas.add(cloneObj);
    cloneObj.bringToFront();
    canvas.setActiveObject(cloneObj);

    setCloneUILocation(cloneObj);
    $('#clone-data').data('value', 100);
    $('#clone-data').html('100%');
    $('#clone-name').html('Clone');
    $('#clone-ui').show();
}

// Remove the widget that allows for adjusting clones and set the values
// into the original object and clone.
cloneWidgetHide = function(obj) {
    $('#clone-ui').hide();
    if (cloneObj != null) {
        var nowTop = cloneObj.getTop();
        var nowLeft = cloneObj.getLeft();
        var origTop = cloneObj.myOriginalTop;
        var origLeft = cloneObj.myOriginalLeft;
        var daddy = cloneObj.daddy;

        var dx = nowLeft - origLeft;
        var dy = nowTop - origTop;
        var freq = $('#clone-data').data('value');
        var theta = daddy.getAngle() * Math.PI / 180;
        var topDiff = -dx * Math.sin(theta) + dy * Math.cos(theta);
        var leftDiff = dx * Math.cos(-theta) - dy * Math.sin(-theta);

        var tx = cloneObj.getAngle() - daddy.getAngle();

        daddy.setCloneOffset(topDiff, leftDiff, tx);
        daddy.setCloneFrequency(freq);
        cloneObj.remove();
        cloneObj = null;
        canvas.setActiveObject(daddy);
    }
}

cloneWidgetAdd = function(amt) {
    var ourDiv = $('#clone-data');
    var value = $(ourDiv).data('value');
    value += amt;
    if (value < 10) value = 10;
    if (value > 100) value = 100;
    $(ourDiv).data('value', value);
    $(ourDiv).html('' + value + '%');
}

//Sprout Functions

setSproutUILocation = function (sprout) {
    console.log("setSproutUILocation");
    var cui = $('#sprout-ui');
    $(cui).width(canvas.getWidth() - 60);
    var offset = $('#construction_frame').offset();

    var myWidth = $(cui).width();
    var myHeight = $(cui).outerHeight();
    ////var objHeight = sprout.getHeight();
    var left = offset.left;
    $(cui).css({ 
        left: left + 10,
        top: 70 /* top margin */ + 20,
        /*
        top: sprout.getTop() - objHeight/2 - myHeight - 15,
        left: sprout.getLeft() - myWidth/2,
        */
    });
    /*
        top: sprout.getTop() - objHeight/2 - myHeight - 15,
        left: sprout.getLeft() - myWidth/2,
        */
}

sproutWidgetShow = function(obj) {
    console.log("sproutWidgitShow");
    // First, we should choose the object we're going to interact with.
    $('#sprout-ui').empty();
    $('#sprout-ui').html('<h1>Select object to sprout</h1>');

    // Insert images
    for (var i = 0; i < spriteTypeList.length; i++) {
        console.log('In interacting for loop');
        var spImage = new window.spriteTypeList[i];
        var imgSrc = spImage.getSrc();
        var iEl = document.createElement('img');
        iEl.src = imgSrc;
        iEl.setAttribute('data-target-type', i);
        //$(iEl).data('targetType', i);
        // This function calls back to setup the SproutAction with the
        // appropriate target
        $(iEl).click(function () {
            console.log('sprout src = '+this.src);
            var tType = $(this).data('target-type');
            obj.setSproutTarget(tType);
            tType = obj.getSproutTarget();
            sproutCloningWidgetShow(obj);
            $('#sprout-ui').hide();
        });
        $('#sprout-ui').append(iEl);
        delete spImage;
    }
    setSproutUILocation(cloneObj);
    $('#clone-name').html('Sprout');
    $('#sprout-ui').show();
    
}

sproutCloningWidgetShow = function(obj) {
    // Sprout is a little different. Show the clone widget now that we've
    // finished selecting the object to sprout.
    setCloneUILocation(obj);
    $('#clone-ui').show();
    var x = obj.getLeft();
    var y = obj.getTop();

    var theta = obj.getAngle() * Math.PI / 180;
    var xo = 45;
    var yo = -45;
    var startX = x + xo * Math.cos(theta) - yo * Math.sin(theta);
    var startY = y + xo * Math.sin(theta) + yo * Math.cos(theta);

    var targetType = obj.getSproutTarget();
    var targetObj = new window.spriteTypeList[targetType];

    var imgElement = document.createElement('img');
    imgElement.src = targetObj.getSrc();
    cloneObj = new fabric.Image(imgElement, {
        lockRotation: false,
        lockScalingX: true,
        lockScalingY: true,
        opacity: 0.7,
        top: startY,
        left: startX,
        cornerSize: 20,
        angle: obj.getAngle(),
    });
    cloneObj.myOriginalTop = startY;
    cloneObj.myOriginalLeft = startX;
    cloneObj.modified = function() {
        setSproutUILocation(this);
    }
    cloneObj.daddy = obj;
    canvas.add(cloneObj);
    cloneObj.bringToFront();
    canvas.setActiveObject(cloneObj);

}

sproutWidgetHide = function(obj) {
    $('#sprout-ui').hide();
    if (cloneObj != null) {
        var nowTop = cloneObj.getTop();
        var nowLeft = cloneObj.getLeft();
        var origTop = cloneObj.myOriginalTop;
        var origLeft = cloneObj.myOriginalLeft;
        var daddy = cloneObj.daddy;

        var dx = nowLeft - origLeft;
        var dy = nowTop - origTop;
        var theta = daddy.getAngle() * Math.PI / 180;
        var topDiff = -dx * Math.sin(theta) + dy * Math.cos(theta);
        var leftDiff = dx * Math.cos(-theta) - dy * Math.sin(-theta);

        var tx = cloneObj.getAngle() - daddy.getAngle();

        daddy.setCloneOffset(topDiff, leftDiff, tx);
        cloneObj.remove();
        cloneObj = null;
        canvas.setActiveObject(daddy);
    }
}

// Hide the sidebar menu for when an object is in "modifying" state
modifyingHide = function(p_obj) {
    var obj = p_obj;
    if (obj == null) {
        obj = canvas.getActiveObject();
    }
    $('#modifying').hide(250);
    $('#uimod_rand').parent().removeClass('highlight');
    $('#uimod_clone').parent().removeClass('highlight');
    $('#uimod_sprout').parent().removeClass('highlight');
    randomSliderHide(obj);
    // Clear recording if we're in the middle of it.
    if (obj && obj.stateRecording) {
        // if we should abort recording, just clear stateRecording
        obj.learningToggle();
    }
}

modifyingShow = function(obj) {
    var offset = window.globalPos;
    var posLeft = obj.getLeft();
    var width = obj.getWidth();
    var posTop = obj.getTop() + offset.top;
    var height = obj.getHeight();
    // Right now we're using centered positions.  Adjust.
    posLeft += width / 2  + offset.left + 15; // +15 padding
    posTop -= height;
    $('#modifying').css({
        top: posTop,
        left: posLeft,
    });
    $('#modifying').show(250);
}

// Sim Measurables
measureShowCounts = false;
measureShowCharts = false;

simDragStop = function(ev, ui) {
    var i;
    var sprite;
    var match = false;
    var source;

    for(i=0; i < window.spriteList.length; i++) {
        sprite = window.spriteList[i];
        point = {y: ev.pageY, x: ev.pageX};
        if (sprite.containsPoint(point)) {
            match = true;
            break;
        }
    }
    if (!match) return;
    
    source = ev.target.id;
    if (source == 'iact_toggle') {
        currentTracker = new Tracker;
    } else {
        currentTracker = new ChartTracker;
    }
    currentTracker.parent = sprite;
    currentTracker.createElement(source, sprite);
    // Prepare to select the interaction target object
    canvas.discardActiveObject();
    simObjectCleared();
    $('#count_blocker').show();
    interactionWaiting = true;
    currentInterObj = sprite;
}

clearTrackers = function() {
    var i;

    for (i=0; i < window.spriteList.length; i++) {
        var s = window.spriteList[i];
        if (s === undefined) continue;
        if (s.countElement == null) continue;

        s.countElement.clear();
        s.countElement.update();
    }

    for (i = 0; i < window.spriteTypeList.length; i++) {
        sprite = window.spriteTypeList[i];
        sprite.prototype.clearHistory();
        sprite.prototype.historyTick();
    }
    return false;
}

/* User Interface code for Sprite InteractionRule */
uiInteractionCB = null;

uiInteractionChoose = function(sprite, callback) {
    uiInteractionCB = callback;
    var offset = window.globalPos;
    var posLeft = sprite.getLeft();
    var width = sprite.getWidth();
    var posTop = sprite.getTop() + offset.top;
    var height = sprite.getHeight();
    // Right now we're using centered positions.  Adjust.
    posLeft += width / 2  + offset.left + 15; // +15 padding
    posTop -= height;
    $('#interactions').css("top", posTop);
    $('#interactions').css("left", posLeft);

    // Hide Individual behaviors (if shown) and show our menu
    modifyingHide(sprite);
    $('#interactions').show();
}

// 
// Text Editing Functions
//
// See toolTextClick for creation

textBeginEditing = function(obj) {
    currentTextObject = obj;

    var offset = window.globalPos;
    var textbox = $('#text-modify');
    var textValue = obj.getText();
    $('#text-alter-field').val(textValue);

    $(textbox).css({
        top: globalPos.top + canvas.getHeight() / 2 - $(textbox).height() / 2,
        left: globalPos.left + canvas.getWidth() / 2 - $(textbox).width() / 2,
    });
    $(textbox).show(250);
}

textEditSet = function(obj, ev) {
    var textbox = $('#text-alter-field');
    currentTextObject.setText($(textbox).val());
    console.log('Text: ' + $(textbox).val());
    canvas.renderAll();
    $('#text-modify').hide(250);
}

textEditCancel = function(obj, ev) {
    $('#text-modify').hide(250);
}

textEditDelete = function(obj, ev) {
}

//
// Click Event Handlers
//

spriteChartClick = function(obj, ev) {
    var i;
    var sprite = null;
    var hash = obj['data-hash'];
    for (i = 0; i < window.spriteTypeList.length; i++) {
        if (window.spriteTypeList[i].prototype.hash == hash) {
            sprite = window.spriteTypeList[i];
            break;
        }
    }
    if (sprite == null) {
        console.log('No Sprite matching ' + hash);
        return;
    }
    $('#count_big_chart').show(100);
    ourOpt = JSON.parse(JSON.stringify(window.sparkOpt));
    ourOpt['width'] = '100px';
    ourOpt['height'] = '50px';
    $('#count_big_chart').sparkline(sprite.prototype.getHistory(), ourOpt);
    ev.stopPropagation();
}

toolTextClick = function(obj, ev) {
    var text = new TextLabel('default text');
    text.init()
    //var text = new fabric.Text('default text', {textAlign: 'center'});
    text.setLeft(canvas.getWidth() / 2);
    text.setTop(canvas.getHeight() / 2);

    /*
    var imgElement = document.createElement('img');
    imgElement.src = '/static/images/close-24.png';
    var close = new fabric.Image(imgElement, {originY: 'bottom', originX: 'right'});
    var group = new fabric.Group([text, close]);
    */
    text.addToCanvas();
    //canvas.add(group);
}

window.save = function() {
    console.log("Saving!");
    rawData = saveSprites();
    $.ajax({
        url: 'save_sim_state',
        type: 'POST',
        data: {
            serialized: rawData,
            name: 'default',
            simid: window.simulationId,
        },
        dataType: 'json'
    });
}

window.load = function() {
    console.log('load');
    //loadSprites($('#data').html());
    $.ajax({
        url: 'load_sim_state',
        type: 'POST',
        data: {
            name: 'default',
            sim_id: window.simulationId,
        },
        dataType: 'json',
        success: function(data) {
            //console.log('data.simState = '+data.simState);
            if (data.status == 'Success') {
                console.log('data.serialized = '+data.serialized);
                loadSprites(data.serialized);
            } else if (data.status == 'Failed') {
                if (data.debug.length) {
                    console.log ('Error(load): ' + data.debug);
                }
                if (data.message.length) {
                    //so far just because nothing is there
                    // mute this for now since save and load is auto for a while
                    //alert('Error: ' + data.message);
                }
            }
        },
    });
}

// UI Setup for events
$(document).ready(function() {

    $('body').click(function () {
        $('#count_big_chart').hide(100);
    });
    interMap = { 'uich_trans': 'transpose',
        'uich_clone': 'clone',
        'uich_delete': 'delete',
        'uich_close': 'close',
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

        if (obj.showRandom()) {
            $(this).parent().addClass('highlight');
            randomSliderShow(obj);
        } else {
            $(this).parent().removeClass('highlight');
            randomSliderHide(obj);
        }
    });

    $('#uimod_clone').click(function() {
        console.log('Onclick');
        obj = canvas.getActiveObject();
        console.log('Object click =' + obj);
        if (!obj.isEditing) {
            console.log('isEditing returns '+ obj.isEditing);
            console.log('Object not being edited');
            return;
        }
        if (obj.isClone()) {
            console.log('Object is clone');
            obj.removeClone();
            $(this).removeClass('highlight');
        } else {
            console.log('Object is not clone, add simple clone');
            obj.addSimpleClone();
            $(this).addClass('highlight');
            cloneWidgetShow(obj);
        }
    });

    $('#uimod_sprout').click(function() {
        obj = canvas.getActiveObject();
        if (!obj.isEditing) return;
        if (obj.isSprout()) {
            obj.removeSprout();
            $(this).removeClass('highlight');
        } else {
            obj.addSprout();
            $(this).addClass('highlight');
            sproutWidgetShow(obj);
        }
    });

    $('#clone-minus').click(function() {
        cloneWidgetAdd(-10);
    });

    $('#clone-plus').click(function() {
        cloneWidgetAdd(10);
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

    $('#save').click(function() {
        console.log('save')
        window.save();
    });

    $('#load').click(function() {
        console.log('load')
        window.load();
    });

    // Measurable panel
    /*
    $('.sim_buttons').each(function (idx, e) {
        $(e).draggable({helper: "clone"});
    });
    */
    simButtonObj = {
        helper: 'clone',
        stop: simDragStop,
    };
    simChartObj = {
        helper: 'clone',
        stop: simDragStop,
    };
    $('#iact_toggle').draggable(simButtonObj);
    $('#iact_chart').draggable(simButtonObj);
    $('#counts').click(function() {
        measureShowCounts = !measureShowCounts;
        if (measureShowCounts) {
            $('#counts').addClass('highlight');
            $('#count_chart').removeClass('highlight');
            $('.sprite-count').each(function(idx, e) {
                $(this).show(100);
            });
            $('.sprite-chart').each(function(idx, e) {
                $(this).hide(100);
            });
            measureShowCharts = false;
        } else {
            $('#counts').removeClass('highlight');
            $('.sprite-count').each(function(idx, e) {
                $(this).hide(100);
            });
        }
    });
    $('#count_chart').click(function() {
        measureShowCharts = !measureShowCharts;
        if (measureShowCharts) {
            $('#count_chart').addClass('highlight');
            $('#counts').removeClass('highlight');
            measureShowCounts = false;
            $('.sprite-chart').each(function(idx, e) {
                $(this).show(100);
            });
            $('.sprite-count').each(function(idx, e) {
                $(this).hide(100);
            });
            $.sparkline_display_visible();
        } else {
            $('.sprite-chart').each(function(idx, e) {
                $(this).hide(100);
            });
            $('#count_chart').removeClass('highlight');
        }
    });

    $('#sim_min').click(function(ev) {
        ev.preventDefault();
        $('#bottom_frame').slideToggle();
        $('#sim_max').show(500);
    });
    $('#sim_max').click(function(ev) {
        ev.preventDefault();
        $('#bottom_frame').slideToggle();
        $(this).hide(250);
    });

});
