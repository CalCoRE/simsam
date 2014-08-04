window.initSim = (function(){

    interactionWaiting = false;     // in state of having just dropped measure
    currentTracker = null;          // operating measure object
    currentSimObject = null;
    cloneObj = null;

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
        // if one object is selected this fires
        if (selectedObject !== null && selectedObject !== undefined) { 
            if (! (typeof selectedObject['learningToggle'] === 'function')) {
                return;
            }
            selectedObject.learningToggle();
            if (selectedObject.stateRecording) {
                selectedObject.bringToFront();
                $('#modifying').show(250);
                if (selectedObject.isRandom()) {
                    $('#uimod_rand').addClass('highlight');
                    randomSliderShow(selectedObject);
                }
                if (selectedObject.isClone()) {
                    $('#uimod_clone').addClass('highlight');
                }
                if (selectedObject.isSprout()) {
                    $('#uimod_sprout').addClass('highlight');
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

simObjectSelected = function(options) {
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
    if (cloneObj != null) {
        cloneWidgetHide();
        return;
    }
    $('#selected').hide(250);
    if (currentSimObject !== undefined) {
        modifyingHide(currentSimObject);
    }
    currentSimObject = null;
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
        message: 'This item will be permanantly deleted.  Are you sure?',
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
        message: 'All items of this type will be permanantly deleted.  Are you sure?',
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
    tpos = topPos - height - 80;
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
    var cui = $('#clone-ui');
    var myWidth = $(cui).width();
    var myHeight = $(cui).outerHeight();
    var objHeight = clone.getHeight();
    $(cui).css({ 
        top: clone.getTop() - objHeight/2 - myHeight - 15,
        left: clone.getLeft() - myWidth/2,
    });
}

cloneWidgetShow = function(obj) {
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
    $('#clone-ui').show();
}

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

// Hide the sidebar menu for when an object is in "modifying" state
modifyingHide = function(p_obj) {
    var obj = p_obj;
    if (obj == null) {
        obj = canvas.getActiveObject();
    }
    $('#modifying').hide(250);
    $('#uimod_rand').removeClass('highlight');
    $('#uimod_clone').removeClass('highlight');
    randomSliderHide(obj);
    // Clear recording if we're in the middle of it.
    if (obj && obj.stateRecording) {
        // if we should abort recording, just clear stateRecording
        obj.learningToggle();
    }
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
            $(this).addClass('highlight');
            randomSliderShow(obj);
        } else {
            $(this).removeClass('highlight');
            randomSliderHide(obj);
        }
    });

    $('#uimod_clone').click(function() {
        obj = canvas.getActiveObject();
        if (!obj.isEditing) return;
        if (obj.isClone()) {
            obj.removeClone();
            $(this).removeClass('highlight');
        } else {
            obj.addSimpleClone();
            $(this).addClass('highlight');
            cloneWidgetShow(obj);
        }
    });
    $('#uimod_sprout').click(function() {
        obj = canvas.getActiveObject();
        if (!obj.isEditing) return;
        if (obj.isClone()) {
            obj.removeClone();
            $(this).removeClass('highlight');
        } else {
            obj.addSimpleClone();
            $(this).addClass('highlight');
            cloneWidgetShow(obj);
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
    });

    $('#load').click(function() {
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
                if (data.status == 'Success') {
                    loadSprites(data.serialized);
                } else if (data.status == 'Failed') {
                    if (data.debug.length) {
                        console.log ('Error(load): ' + data.debug);
                    }
                    if (data.message.length) {
                        alert('Error: ' + data.message);
                    }
                }
            },
        });
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
