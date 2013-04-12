# globals
thumbnailScaleFactor = 0.25;
cameraSwitch = {}               # will be reference to on/off node
playbackFrames = []             # full-size canvas elements, in playback order
frameRegistry = {}              # all full-size canvas elements, by id
playbackTimeouts = []           # list of timeout handles for current playback
                                # allows them to be canceled (i.e. pause 
                                # playback)
overlayClass = "overlay-frame"
playbackClass = "playback-frame"
window.isPlaying = false
window.playbackIndex = 0
window.debug = true             # turns on console logging

$(document).ready ->

    #console.log(playbackFrames)
    #console.log(frameRegistry)

	#load sprite image from file
        #playbackFrames[i] = window.spritecollection[i]
    
	# frameRegistry[i] =  i<window.spritecollection.length; window.spritecollection.forEach(displayCanvas)

    # hide elements of sim
    $('#sambutton').hide()
    $('#container').hide()
    $('#output').hide()

    # get some handy references to DOM nodes
    window.camera = $("#camera").get 0
    window.buttons =
        shoot: $("#shoot_button").get 0
        beginning: $("#beginning_button").get 0
        frameBack: $("#frame_back_button").get 0
        play: $("#play_button").get 0
        pause: $("#pause_button").get 0
        frameForward: $("#frame_forward_button").get 0
        end: $("#end_button").get 0
    
    # init other stuff
    constraints = {audio:true, video:true}
        
    # check that we have webcam support
    if html5support.getUserMedia()
        success = (stream) ->
            camera.src = stream
            camera.play()
        failure = (error) -> alert JSON.stringify error
        
        navigator.getUserMedia constraints, success, failure
    else
        alert "Your browser does not support getUserMedia()"
        
    # wire up buttons
    $(buttons.shoot).click shoot
    $(buttons.play).click play
    $(buttons.pause).click pause
    $(buttons.frameBack).click frameBack
    $(buttons.frameForward).click frameForward
    $(buttons.beginning).click frameBeginning
    $(buttons.end).click frameEnd
    $(buttons.shoot).button()
    $("#simbutton").click startSimlite
    $("#sambutton").click startSamlite

    
    #http://farhadi.ir/projects/html5sortable/
    $("#video_output").sortable().bind 'sortupdate', rescanThumbnails
    $("#video_output").sortable().bind 'sortupdate', saveFrameSequence
    $("#trash").sortable({connectWith:"#video_output"}).bind 'receive', trash
    
    # fps slider
    $("#fps_slider").slider
        value: 10
        min: 1
        max: 50
        step: 1
        slide: (event,ui) ->
            $("#fps").val ui.value
    
    # camera toggle button
    cameraSwitch = $("#camera_onoff").iphoneStyle
        onChange: toggleCamera
        
    # prevent text highlighting
    # opera-specific
    makeUnselectable $(document.body).get 0
    # other browsers SHOULD be handled through the .unselectable class
    # on the body tag
    # see http://stackoverflow.com/questions/2326004/prevent-selection-in-html
    for element in window.spritecollection
        loadSprites(element)
    for element in window.framesequence
        loadFrames(element)

loadSprites = (sprite) ->
    output = $("#crop_output").get(0) 
    canvas = document.createElement('canvas')
    ctx = canvas.getContext('2d')
    img = new Image()
    img.onload = ->
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0, img.width, img.height)
    img.src = 'http://' + window.location.host + '/static/sprites/' + sprite + '.jpg'
    $(canvas).attr("data-frame-id", sprite)
    output.appendChild canvas   
    

loadFrames = (frame) ->
    output = $("#video_output").get(0)
    canvas = document.createElement('canvas')
    ctx = canvas.getContext('2d')
    img = new Image()
    img.onload = ->
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0, img.width, img.height)
    img.src = 'http://' + window.location.host + '/static/sam_frames/' + frame + '.jpg'

    frameOrdinal = playbackFrames.push canvas
    thumbnail = document.createElement('canvas')
    context = thumbnail.getContext('2d')
    thumb = new Image()
    thumb.onload = ->
        thumbnail.width = thumb.width * thumbnailScaleFactor
        thumbnail.height = thumb.height * thumbnailScaleFactor
        context.drawImage(thumb, 0, 0, thumbnail.width, thumbnail.height)
    thumb.src = 'http://' + window.location.host + '/static/sam_frames/' + frame + '.jpg'
    frameId = frameIndex = frameOrdinal - 1
    $(thumbnail).attr "data-frame-id", frame
    $(canvas).attr "data-frame-id", frame
    frameRegistry[frame] = canvas
    
    output.appendChild thumbnail
    $("#video_output").sortable "refresh"

    rescanThumbnails()
 
    placeFrame frameIndex, overlayClass
    
   
    #camera = $("#camera").get(0)
    #camera.appendChild canvas
    #alert(camera)
    #frameOrdinal = playbackFrames.push canvas
    #frameId = frameIndex = frameOrdinal - 1
    #$(canvas).attr("data-frame-id", frame)
    #output.appendChild canvas  
    #frameRegistry[frame] = canvas
    #$("#video_output").sortable "refresh"
    #rescanThumbnails()
    #$(canvas).attr("id", "canvas")
    #placeFrame frame, overlayClass
    #console.log(frameRegistry)
    #console.log(playbackFrames)    
        
makeUnselectable = (node) ->
    if node.nodeType is 1
        node.setAttribute "unselectable", "on"
    child = node.firstChild
    while child
        makeUnselectable child
        child = child.nextSibling

# These don't actually turn the camera on and off; it's really always on
# they just show and hide the canvas displaying what the camera sees

toggleCamera = ->
    clearPlayback()
    if cameraSwitch.is ':checked'
        if window.debug then console.log "toggle camera off"
        $(camera).css "display","block" 
    else
        if window.debug then console.log "toggle camera off"
        $(camera).css "display","none"

# simulates a user clicking the checkbox
cameraOn = ->
    if window.debug then console.log "camera on"
    cameraSwitch.prop("checked", true).iphoneStyle "refresh"
cameraOff =  ->
    if window.debug then console.log "camera off"
    cameraSwitch.prop("checked", false).iphoneStyle "refresh"
    

# Captures a image frame from the provided video element.
#
# @param {Video} video HTML5 video element from where the image frame will 
# be captured.
# @param {Number} scaleFactor Factor to scale the canvas element that will be
# return. This is an optional parameter.
# @return {Canvas}

capture = (video, scaleFactor) ->
    if not scaleFactor then scaleFactor = 1
    w = video.videoWidth * scaleFactor
    h = video.videoHeight * scaleFactor
    canvas = document.createElement 'canvas'
    canvas.width  = w
    canvas.height = h
    ctx = canvas.getContext '2d'
    ctx.drawImage video, 0, 0, w, h
    return canvas

# Invokes the <code>capture</code> function and attaches the canvas element 
# to the DOM.

window.shoot = ->
    pause()
    clearPlayback()
    cameraOn()

    # we're in the global scope, so need to make some of our references
    video  = $("#camera").get 0
    console.log(video)
    output = $("#video_output").get 0

    # store a new frame
    frame = capture video, 1
    console.log("frame")
    console.log(frame)
    frameOrdinal = playbackFrames.push frame
    thumbnail = capture video, thumbnailScaleFactor
    frameId = frameIndex = frameOrdinal - 1
        
    # store ids that link the frame and the thumbnail
    # these ids will later be replaced by permanent ids, based on a hash,
    # from the server
    $(thumbnail).attr "data-frame-id", frameId
    $(frame).attr "data-frame-id", frameId
    
    # store the frame in the registry so the playback frames can be reordered
    # by id when the thumbnails are reordered
    frameRegistry[frameId] = frame
    console.log(frameRegistry)
    console.log(playbackFrames)
    
    # display the thumbnail
    output.appendChild thumbnail
    $("#video_output").sortable "refresh"
    
    # make the thumbnail clickable
    rescanThumbnails()
    
    # overlay the new frame
    placeFrame frameIndex, overlayClass

    saveCanvas(frame, frameId)
    

saveCanvas = (canvas, tempId) ->
    imageStringRaw = canvas.toDataURL "image/jpeg"
    imageString = imageStringRaw.replace "data:image/jpeg;base64,", ""
    
    ajaxOptions =
        url: "save_image"
        type: "POST"
        data:
            image_string: imageString
            image_type: "AnimationFrame"
            animation_id: window.animationId
        dataType: "json"

    done = (response) ->
        if window.debug then console.log "save canvas ajax, sent:", ajaxOptions, "response:", response
        if response.success
            # re-index the frame according to it's new, server-issued id
            frame = frameRegistry[tempId]
            delete frameRegistry[tempId]
            frameRegistry[response.id] = frame
            # write the id to the frame and thumbnail nodes so that
            # building the playbackFrames will work correctly
            $(frame).attr "data-frame-id", response.id
            $("#video_output canvas[data-frame-id='#{tempId}']").attr "data-frame-id",
                response.id

    $.ajax(ajaxOptions).done(done)

# called by the sortable container of thumbnails, sends ordered list of
# frame ids to the server for saving
saveFrameSequence = ->
    if window.debug then console.log "saveFrameSequence"
    frameSequence = ($(frame).attr("data-frame-id") for frame in playbackFrames)

    ajaxOptions =
        url: "save_frame_sequence"
        type: "POST"
        data:
            animation_id: window.animationId
            frame_sequence: frameSequence
        dataType: "json"

    done = (response) ->
        if window.debug then console.log "save frame sequence ajax, sent:", ajaxOptions, "response:", response
        if response.success
            console.log response.message
            # do nothing, I think
        #else
        #    console.error response.message
    
    $.ajax(ajaxOptions).done(done)

# remove the css class that makes the frame transparent (if it's there) and
# remove the frame from the DOM

clearPlayback = ->
    if window.debug then console.log "clearPlayback"
    # .removeClass() with no arguments removes all class names
    $("#playback_container *").removeClass().remove()
        
# put a still frame on top of the webcam view; it may be a transparent
# onion-skin or an opaque playback frame
#
# @param {Number} frame index
# @param {String} css class name to apply to the placed canvas node
        
placeFrame = (frameIndex, className = "") ->
    if window.debug then console.log "placeFrame"
    clearPlayback()
    frame = playbackFrames[frameIndex]
    # allow special overlay styling of frames
    $(frame).addClass className
    frame.id = "canvas"
    $("#playback_container").append frame
    
# run through the canvas elements in the thumbnail list and update
# everything to by in sync with those thumbnails, including the onclick
# event for thumbnails
    
rescanThumbnails = ->
    if window.debug then console.log "rescanThumbnails"
    # reset the playbackFrames list so it can be rebuilt in the right order
    playbackFrames = []
    idsToSave = []
    
    # build the new playback list and also rebuild the thumbnail click events
    # so they match the correct indices
    $("#video_output *").each (index, thumbnail) ->
        frameId = $(thumbnail).attr "data-frame-id"
        playbackFrames.push frameRegistry[frameId]
        idsToSave.push frameId
        $(thumbnail).unbind("click").click ->
            pause()
            clearPlayback()
            cameraOn()
            placeFrame index, overlayClass
            window.playbackIndex = index
            updateIndexView()

    updateIndexView()
    
# Called by the "trash" (really a sortable list linked with the thumbnail
# list) when a thumbnail is dropped in. Deletes the thumbnail and resyncs.
            
trash = (event) ->
    if window.debug then console.log "trash"
    $("#trash canvas").remove()
    $("#trash .sortable-placeholder").remove()
    rescanThumbnails()
    if window.playbackIndex >= playbackFrames.length then frameEnd()

# Put a series of opaque still canvases over the webcam view, effectively
# "playing back" the movie. Works by looping through the playback frames
# and setting up a series of timed callbacks, which each fire at their
# appointed time and put up their frame.
    
window.play = ->
    if window.debug then console.log "play"
    if window.isPlaying
        if window.debug then console.log "already playing, doing nothing"
        return
    
    # if the playback index is at the end, we want to play from
    # the beginning
    if window.debug then console.log "getting ready to play. length:", playbackFrames.length, "playback index", window.playbackIndex
    if playbackFrames.length is window.playbackIndex + 1
        if window.debug then console.log "resetting to zero"
        window.playbackIndex = 0
        updateIndexView()
    window.isPlaying = true
    cameraOff()
    container = $("#video_container")
    interval = 1 / $("#fps").val() * 1000
    beginningIndex = window.playbackIndex
    
    for frame, index in playbackFrames when index >= window.playbackIndex
        do (frame, index) ->
            callback = ->
                if window.debug then console.log "playback callback, index:", index
                if window.debug then console.log "play loop, index:", index, "delay:", delay
                placeFrame index, playbackClass
                if playbackFrames.length is index + 1
                    # then we're done
                    window.isPlaying = false
                else
                    # then move on to the next one
                    window.playbackIndex = index + 1
                updateIndexView()
            # we want playback to start right away even if the current
            # index is high
            delay = interval * (index - beginningIndex)
            playbackTimeouts[index] = setTimeout callback, delay
            if window.debug then console.log "play loop, index:", index, "delay:", delay
            
    if playbackFrames.length is 0
        window.isPlaying = false
        $("#playback_container").append "<div class='frametext'>Empty</div>"
            
# playback controls    
        
pause = ->
    if not window.isPlaying then return
    window.isPlaying = false
    for timeout in playbackTimeouts
        clearTimeout timeout
        
frameBack = ->
    pause()
    if window.playbackIndex is 0 then return
    else window.playbackIndex -= 1
    placeFrame window.playbackIndex, playbackClass
    updateIndexView()
    
frameForward = ->
    pause()
    max = playbackFrames.length - 1
    if window.playbackIndex is max then return
    else window.playbackIndex += 1
    placeFrame window.playbackIndex, playbackClass
    updateIndexView()
    
frameBeginning = ->
    pause()
    window.playbackIndex = 0
    placeFrame 0, playbackClass
    updateIndexView()
    
frameEnd = ->
    pause()
    max = playbackFrames.length - 1
    window.playbackIndex = max
    placeFrame max, playbackClass
    updateIndexView()
    
# just for window.debugging

updateIndexView = -> $("#playback_index").get(0).value = window.playbackIndex

# functions to switch between sam and sim
startSimlite = ->
    # hide samlite containers
    $('#controls_container').hide()
    $('#playback_container').hide()
    $('#video_container').hide()
    $('#simbutton').hide()
    $('#crop_buttons').hide()
    cameraOff()
    # show simlite containers
    $('#container').show()
    $('#output').show()
    $('#sambutton').show()

startSamlite = ->
    # show SAM containers
    $('#controls_container').show()
    $('#playback_container').show()
    $('#video_container').show()
    $('#simbutton').show()
    $('#crop_buttons').show()
    # hide SiM containers
    $('#container').hide()
    $('#output').hide()
    $('#sambutton').hide()
    
    
