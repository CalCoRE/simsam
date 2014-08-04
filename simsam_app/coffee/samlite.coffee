$ ->
    # globals
    thumbnailScaleFactor = 0.25;
    cameraSwitch = {}               # will be reference to on/off node
    window.playbackFrames = []      # full-size canvas elements, in playback order
    frameRegistry = {}              # all full-size canvas elements, by id
    playbackTimeouts = []           # list of timeout handles for current playback
                                    # allows them to be canceled (i.e. pause 
                                    # playback)
    overlayClass = "overlay-frame"
    playbackClass = "playback-frame"
    window.isPlaying = false
    window.isCropping = false       # if we're cropping we shouldn't play on click
    window.playbackIndex = 0
    window.debug = true             # turns on console logging
    menu = false # side menu
    recording = false #starts out in play mode, switches to record if camera
    cameraState = 1
    anyCamera = true
    
    # sprite collection wasn't initialized for a new animation and were
    # creating an error when they were first used
    # Amanda: is this the right way to do this?
    window.spritecollection = []
    
    
    window.initSam = ->
        # hide elements of sim
        $('#switch_to_sam_button').hide()
        $('#container').hide()
        $('#output').hide()
        $('#sim_buttons').hide()
        $('#record_mode').hide()
    
        # hide save crop and cancel crop buttons (cropping not started yet)
        $('#savecrop').hide()
        $('#cancelcrop').hide()
    
        # get some handy references to DOM nodes
        window.camera = $("#camera").get 0
    
        # clicking on the screen is the same as clicking on the active mode button
        $("#replay").click ->
            if (recording)
                shoot()
            else
                if( not isCropping )
                   play()
        
        # wire up buttons
        $("#switch_to_sim_button").click startSimlite
        $("#switch_to_sam_button").click startSamlite
        #MHWJ
        $("#right_menu_button").click toggleMenu
        $("#play_mode").click play
        $("#record_mode").click toggleMode
    
        #http://farhadi.ir/projects/html5sortable/
        $("#video_output").sortable().bind 'sortupdate', rescanThumbnails
        $("#video_output").sortable().bind 'sortupdate', saveFrameSequence
        $("#trash").sortable({connectWith:"#video_output"}).bind 'receive', trash
        
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
    
        # if there are no frames available, do not allow cropping
        if playbackFrames.length == 0 then $('#startcropping').hide()
    
        # check that we have webcam support
        if html5support.getUserMedia()
            console.log("user media available")
            success = (stream) ->
                console.log("success")
                camera.src = stream
                camera.play()
                $('#record_mode').show()
                # if getUserMedia is available, start in record mode
                switchToRecordMode()
            failure = (error) -> 
                anyCamera = false
                window.playbackIndex = 0
                switchToPlaybackMode()
                alert "For some reason, we can't access your camera. Try reloading and permitting access."
            html5support.getUserMedia {video:true}, success, failure
        else
            anyCamera = false
            window.playbackIndex = 0
            switchToPlaybackMode()
            alert "Your browser will not allow SiMSAM to use the webcam. Related functions will be disabled."
    
        # always start in record mode
        #switchToRecordMode()
    
    loadSprites = (sprite) ->
        output = $("#sprite_drawer").get(0) 
        #canvas = document.createElement('canvas')
        #ctx = canvas.getContext('2d')
        img = new Image()
        #img.onload = ->
        #    canvas.width = img.width
        #    canvas.height = img.height
        #    ctx.drawImage(img, 0, 0, img.width, img.height)
        img.src = 'http://' + window.location.host + '/media/sprites/' + sprite + '.jpg'
        img.className = "sprite"
        img.setAttribute('data-hash', sprite)
        #$(canvas).attr("data-frame-id", sprite)
        #$(canvas).attr("draggable", true);
        #$(canvas).attr("dropzone", $('container'))
        #canvas.addEventListener "dblclick", (e) => addObject(img)
        #img.addEventListener "dblclick", (e) => spriteList.push( new spriteTypeList[] )
        output.appendChild img

        cnt = document.createElement('div')
        cnt.className = 'sprite-count'
        cnt.id = sprite
        cnt.innerHTML = '0'
        output.appendChild cnt

        chrt = document.createElement('div')
        chrt.className = "sprite-chart"
        chrt['data-hash'] = sprite
        chrt['data-type'] = sprite.spriteType
        chrt.id = 'chart-' + sprite
        chrt.innerHTML = ''
        $(chrt).click( (ev) -> spriteChartClick(this, ev))
        output.appendChild chrt
    
    loadFrames = (frame) ->
        output = $("#video_output").get(0)
        canvas = document.createElement('canvas')
        ctx = canvas.getContext('2d')
        img = new Image()
        img.onload = ->
            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0, img.width, img.height)
        img.src = 'http://' + window.location.host + '/media/sam_frames/' + frame + '.jpg'
    
        frameOrdinal = playbackFrames.push canvas
        thumbnail = document.createElement('canvas')
        context = thumbnail.getContext('2d')
        thumb = new Image()
        thumb.onload = ->
            thumbnail.width = thumb.width * thumbnailScaleFactor
            thumbnail.height = thumb.height * thumbnailScaleFactor
            context.drawImage(thumb, 0, 0, thumbnail.width, thumbnail.height)
        thumb.src = 'http://' + window.location.host + '/media/sam_frames/' + frame + '.jpg'
        frameId = frameIndex = frameOrdinal - 1
        $(thumbnail).attr "data-frame-id", frame
        $(canvas).attr "data-frame-id", frame
        frameRegistry[frame] = canvas
        
        output.appendChild thumbnail
        $("#video_output").sortable "refresh"
    
        rescanThumbnails()
     
        placeFrame frameIndex, (if recording then overlayClass else playbackClass)
        
    
    makeUnselectable = (node) ->
        if node.nodeType is 1
            node.setAttribute "unselectable", "on"
        child = node.firstChild
        while child
            makeUnselectable child
            child = child.nextSibling
    
    # These don't actually turn the camera on and off; it's really always on
    # they just show and hide the canvas displaying what the camera sees
    # if the optionalMode is true, switch to camera regardless of current state
    # that's for when a frame is clicked
    
    toggleCamera = ->
        # if cameraSwitch.is ':checked'
        if cameraState is 0
            cameraOn
        else
            cameraOff
    
    # sometimes we want to turn camera on or off rather than toggle
    
    cameraOn = ->
        if window.debug then console.log "toggle camera on"
        # hide the playback frames which would otherwise hide
        # the camera feed
        clearPlayback()
        cameraState = 1
        # show the camera feed
        $(camera).css "display","block" 
            
    cameraOff = ->
        if window.debug then console.log "toggle camera off"
        # hide the camera feed
        $(camera).css "display","none"
        cameraState = 0
        # display the most recently displayed playback frame
        placeFrame window.playbackIndex
    
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
    
    # Generates a random string to server as a temporary client-side id
    
    getRandomId = () ->
        possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        text = ''
        for x in [1..5]
            text += possible.charAt(Math.floor(Math.random() * possible.length))
        return 'tempFrameId_' + text
    
    
    # Invokes the <code>capture</code> function and attaches the canvas element 
    # to the DOM.
    
    window.shoot = ->
        pause()
        clearPlayback()
    
        # we're in the global scope, so need to make some of our references
        video  = $("#camera").get 0
        console.log(video)
        output = $("#video_output").get 0
    
        # capture a new frame
        frame = capture video, 1
        thumbnail = capture video, thumbnailScaleFactor
        console.log("shot frame")
        console.log(frame)
        
        if playbackFrames.length == 0
            # add the frame at the beginning, first frame
            playbackFrames[0] = frame
            frameId = frameIndex = 0
        else
            # add it after the current play index
            frameIndex = playbackIndex + 1
            frameId = getRandomId()
            playbackFrames.splice(frameIndex, 0, frame)
            
        # store ids that link the frame and the thumbnail
        # these ids will later be replaced by permanent ids, based on a hash,
        # from the server
        $(thumbnail).attr "data-frame-id", frameId
        $(frame).attr "data-frame-id", frameId
        
        # store the frame in the registry so the playback frames can be reordered
        # by id when the thumbnails are reordered
        frameRegistry[frameId] = frame
        console.log("frameRegistry")
        console.log(frameRegistry)
        console.log("playbackFrames")
        console.log(playbackFrames)
        
        # display the thumbnail at the correct position
        if playbackFrames.length > 1
            $("#video_output canvas:eq(#{playbackIndex})").after(thumbnail)
        else
            output.appendChild(thumbnail)
    
        $("#video_output").sortable "refresh"
        
        # make the thumbnail clickable and sort the playback frames to match
        rescanThumbnails()
        
        # overlay the new frame
        placeFrame frameIndex, overlayClass
    
        # set the playback index to the new frame, so if the user switches to
        # playback mode, this frame will be up
        window.playbackIndex = frameIndex
        $('#startcropping').show()
    
        saveCanvas(frame, frameId)
        
    
    saveCanvas = (canvas, tempId) ->
        imageStringRaw = canvas.toDataURL "image/jpeg"
        imageString = imageStringRaw.replace "data:image/jpeg;base64,", ""
        if window.debug then console.log "savecanvas", window.animationId
        
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
        $("#replay *").removeClass().remove()
            
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
        $("#replay").append frame
    
    placeBlankFrame = ->
        $("#replay").append('<div class="blank-frame"><div>nothing here</div></div>')
        
    # run through the canvas elements in the thumbnail list and update
    # everything to be in sync with those thumbnails, including the onclick
    # event for thumbnails
        
    rescanThumbnails = ->
        if window.debug then console.log "rescanThumbnails"
        # reset the playbackFrames list so it can be rebuilt in the right order
        window.playbackFrames = []
        idsToSave = []
        
        # build the new playback list and also rebuild the thumbnail click events
        # so they match the correct indices
        $("#video_output *").each (index, thumbnail) ->
            frameId = $(thumbnail).attr "data-frame-id"
            window.playbackFrames.push frameRegistry[frameId]
            idsToSave.push frameId
            $(thumbnail).unbind("click").click ->
                pause()
                # if it's in recording mode then overlay, otherwise opaque
                placeFrame index, (if recording then overlayClass else playbackClass)
                window.playbackIndex = index
    
    # Called by the "trash" (really a sortable list linked with the thumbnail
    # list) when a thumbnail is dropped in. Deletes the thumbnail and resyncs.
                
    trash = (event) ->
        if window.debug then console.log "trash"
        $("#trash canvas").remove()
        $("#trash .sortable-placeholder").remove()
        rescanThumbnails()
        if window.playbackIndex >= playbackFrames.length
            max = playbackFrames.length - 1
            window.playbackIndex = max
            if recording
                # in record mode, if there are any frames, display the onion skin
                # of the last one
                if window.playbackFrames.length > 0
                    placeFrame max, overlayClass
                # if there are no frames, clear the onionskin and just let the
                # camera be visible
                else
                    clearPlayback()
            else
                # in playback mode, if there are any frames, display the last one
                if window.playbackFrames.length > 0
                    placeFrame max, playbackClass
                # if there are no frames, show a special message saying so
                else
                    clearPlayback()
                    placeBlankFrame()
        saveFrameSequence()
    
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
        window.isPlaying = true
        container = $("#video_frame")
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
                # we want playback to start right away even if the current
                # index is high
                delay = interval * (index - beginningIndex)
                playbackTimeouts[index] = setTimeout callback, delay
                if window.debug then console.log "play loop, index:", index, "delay:", delay
                
        if playbackFrames.length is 0
            window.isPlaying = false
            # $("#replay").append "<div class='frametext'>Empty</div>"
                
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
        
    frameForward = ->
        pause()
        max = playbackFrames.length - 1
        if window.playbackIndex is max then return
        else window.playbackIndex += 1
        placeFrame window.playbackIndex, playbackClass
        
    frameBeginning = ->
        pause()
        window.playbackIndex = 0
        placeFrame 0, playbackClass
        
    frameEnd = ->
        pause()
        max = playbackFrames.length - 1
        window.playbackIndex = max
        if window.playbackFrames.length > 0
            placeFrame max, playbackClass
        else
            clearPlayback()
            placeBlankFrame()
        
    # functions to switch between sam and sim
    startSimlite = ->
        # hide samlite containers
        #$('#controls_container').hide()
        $('#replay').hide()
        $('#video_frame').hide()
        $('#video_bottom').hide()
        $('#switch_to_sim_button').hide()
        $('#crop_buttons').hide()
        $('#clear').show()
        # show simlite containers
        $('#container').show()
        $('#output').show()
        $('#switch_to_sam_button').show()
        $('#trash_menu_button').show()
        $('#save').show()
        $('#load').show()
        $('.sim_bottom').show()
        $('#sim_buttons').show()
        $('#sim_min').show()
        # Show the measurement statistics
        $(".measure-follow").each (index, thumbnail) ->
            $(this).show()
        if measureShowCounts
            $(".sprite-count").each (index, thumbnail) ->
                $(this).show()
        if measureShowCharts
            $(".sprite-chart").each (index, thumbnail) ->
                $(this).show()
        window.loadSpriteTypes()
    
    startSamlite = ->
        # show SAM containers
        $('#controls_container').show()
        $('#replay').show()
        $('#video_frame').show()
        $('#switch_to_sim_button').show()
        $('#crop_buttons').show()
        $('#video_bottom').show()
        $('#bottom_frame').show()
        # hide SiM containers
        $('#container').hide()
        $('#output').hide()
        $('#switch_to_sam_button').hide()
        $('#clear').hide()
        $('#trash_menu_button').hide()
        $('#save').hide()
        $('#load').hide()
        $('.sim_bottom').hide()
        $('#sim_buttons').hide()
        $('#sim_min').hide()
        $('#sim_max').hide()
        # Hide the measurement statistics
        $(".measure-follow").each (index, thumbnail) ->
            $(this).hide()
        $(".sprite-count").each (index, thumbnail) ->
            $(this).hide()
        $(".sprite-chart").each (index, thumbnail) ->
            $(this).hide()
        
        #MHWJ
    toggleMenu = ->
        if menu
            $('#right_frame').hide("slide", {direction: "right"}, 500);
            $('#construction_frame').animate({ right: '0px' }, 500)
            $('#right_menu_button').css("image", "../images/openmenu.png")
            $('#right_menu_button').animate({ right: '5px' }, 500)
            menu = false
        else
            # show SAM containers
            $('#right_frame').show("slide", {direction: "right"}, 500);
            $('#construction_frame').animate({ right: '200px' }, 500)
            $('#right_menu_button').css("image", "../images/closemenu.png")
            $('#right_menu_button').animate({ right: '205px' }, 500)
            menu = true
    
    toggleMode = ->
        # browsers that don't support getUserMedia start in playback mode
        # and aren't allowed to leave it
        if not anyCamera then return
    
        if recording
            switchToPlaybackMode()
        else
            switchToRecordMode()
    
    
    window.switchToRecordMode = ->
        console.log("switchToRecordMode()")
        recording = true
        if playbackFrames.length > 0
            #maxFrame = playbackFrames.length - 1
            #placeFrame maxFrame, overlayClass
            placeFrame window.playbackIndex, overlayClass
        else
            # placeFrame would do this for us, but we have nothing to place
            # so clear the blank frame
            clearPlayback()
        $('#record_mode').removeClass('small').addClass('big')        
        $('#play_mode').removeClass('big').addClass('small')
        $('#play_mode').unbind('click').click toggleMode
        $('#record_mode').unbind('click').click shoot
    
    window.switchToPlaybackMode = ->
        console.log("switchToPlaybackMode()")
        recording = false
        if playbackFrames.length > 0
            placeFrame window.playbackIndex, playbackClass
        else
            placeBlankFrame()
        $('#play_mode').removeClass('small').addClass('big')
        $('#record_mode').removeClass('big').addClass('small')
        $('#play_mode').unbind('click').click play
        $('#record_mode').unbind('click').click toggleMode
