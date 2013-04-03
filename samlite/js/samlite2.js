// Generated by CoffeeScript 1.5.0-pre
(function() {
  var cameraOff, cameraOn, cameraSwitch, capture, clearPlayback, frameBack, frameBeginning, frameEnd, frameForward, frameRegistry, makeUnselectable, openProject, overlayClass, pause, placeFrame, playbackClass, playbackFrames, playbackTimeouts, rescanThumbnails, saveCanvas, saveFrameSequence, startSamlite, startSimlite, thumbnailScaleFactor, toggleCamera, trash, updateIndexView;

  thumbnailScaleFactor = 0.25;

  cameraSwitch = {};

  playbackFrames = [];

  frameRegistry = {};

  playbackTimeouts = [];

  overlayClass = "overlay-frame";

  playbackClass = "playback-frame";

  window.isPlaying = false;

  window.playbackIndex = 0;

  window.debug = true;

  $(document).ready(function() {
    var constraints, failure, success;
    alert(window.animationId);
    console.log(window.framesequence);
    console.log(window.spritecollection);
    $('#sambutton').hide();
    $('#container').hide();
    $('#output').hide();
    window.camera = $("#camera").get(0);
    window.buttons = {
      shoot: $("#shoot_button").get(0),
      beginning: $("#beginning_button").get(0),
      frameBack: $("#frame_back_button").get(0),
      play: $("#play_button").get(0),
      pause: $("#pause_button").get(0),
      frameForward: $("#frame_forward_button").get(0),
      end: $("#end_button").get(0)
    };
    constraints = {
      audio: true,
      video: true
    };
    if (html5support.getUserMedia()) {
      success = function(stream) {
        camera.src = stream;
        return camera.play();
      };
      failure = function(error) {
        return alert(JSON.stringify(error));
      };
      navigator.getUserMedia(constraints, success, failure);
    } else {
      alert("Your browser does not support getUserMedia()");
    }
    $(buttons.shoot).click(shoot);
    $(buttons.play).click(play);
    $(buttons.pause).click(pause);
    $(buttons.frameBack).click(frameBack);
    $(buttons.frameForward).click(frameForward);
    $(buttons.beginning).click(frameBeginning);
    $(buttons.end).click(frameEnd);
    $(buttons.shoot).button();
    $("#simbutton").click(startSimlite);
    $("#sambutton").click(startSamlite);
    $("#video_output").sortable().bind('sortupdate', rescanThumbnails);
    $("#video_output").sortable().bind('sortupdate', saveFrameSequence);
    $("#trash").sortable({
      connectWith: "#video_output"
    }).bind('receive', trash);
    $("#fps_slider").slider({
      value: 10,
      min: 1,
      max: 50,
      step: 1,
      slide: function(event, ui) {
        return $("#fps").val(ui.value);
      }
    });
    cameraSwitch = $("#camera_onoff").iphoneStyle({
      onChange: toggleCamera
    });
    return makeUnselectable($(document.body).get(0));
  });

  makeUnselectable = function(node) {
    var child, _results;
    if (node.nodeType === 1) {
      node.setAttribute("unselectable", "on");
    }
    child = node.firstChild;
    _results = [];
    while (child) {
      makeUnselectable(child);
      _results.push(child = child.nextSibling);
    }
    return _results;
  };

  toggleCamera = function() {
    clearPlayback();
    if (cameraSwitch.is(':checked')) {
      if (window.debug) {
        console.log("toggle camera off");
      }
      return $(camera).css("display", "block");
    } else {
      if (window.debug) {
        console.log("toggle camera off");
      }
      return $(camera).css("display", "none");
    }
  };

  cameraOn = function() {
    if (window.debug) {
      console.log("camera on");
    }
    return cameraSwitch.prop("checked", true).iphoneStyle("refresh");
  };

  cameraOff = function() {
    if (window.debug) {
      console.log("camera off");
    }
    return cameraSwitch.prop("checked", false).iphoneStyle("refresh");
  };

  capture = function(video, scaleFactor) {
    var canvas, ctx, h, w;
    if (!scaleFactor) {
      scaleFactor = 1;
    }
    w = video.videoWidth * scaleFactor;
    h = video.videoHeight * scaleFactor;
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    return canvas;
  };

  window.shoot = function() {
    var frame, frameId, frameIndex, frameOrdinal, output, thumbnail, video;
    pause();
    clearPlayback();
    cameraOn();
    video = $("#camera").get(0);
    output = $("#video_output").get(0);
    frame = capture(video, 1);
    frameOrdinal = playbackFrames.push(frame);
    thumbnail = capture(video, thumbnailScaleFactor);
    frameId = frameIndex = frameOrdinal - 1;
    $(thumbnail).attr("data-frame-id", frameId);
    $(frame).attr("data-frame-id", frameId);
    frameRegistry[frameId] = frame;
    output.appendChild(thumbnail);
    $("#video_output").sortable("refresh");
    rescanThumbnails();
    placeFrame(frameIndex, overlayClass);
    return saveCanvas(frame, frameId);
  };

  saveCanvas = function(canvas, tempId) {
    var ajaxOptions, done, imageString, imageStringRaw;
    alert("saveCanvas");
    imageStringRaw = canvas.toDataURL("image/jpeg");
    imageString = imageStringRaw.replace("data:image/jpeg;base64,", "");
    ajaxOptions = {
      url: "save_image",
      type: "POST",
      data: {
        image_string: imageString,
        image_type: "AnimationFrame",
        animation_id: window.animationId
      },
      dataType: "json"
    };
    done = function(response) {
      var frame;
      if (window.debug) {
        console.log("save canvas ajax, sent:", ajaxOptions, "response:", response);
      }
      if (response.success) {
        frame = frameRegistry[tempId];
        delete frameRegistry[tempId];
        frameRegistry[response.id] = frame;
        $(frame).attr("data-frame-id", response.id);
        return $("#video_output canvas[data-frame-id='" + tempId + "']").attr("data-frame-id", response.id);
      }
    };
    return $.ajax(ajaxOptions).done(done);
  };

  saveFrameSequence = function() {
    var ajaxOptions, done, frame, frameSequence;
    if (window.debug) {
      console.log("saveFrameSequence");
    }
    frameSequence = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = playbackFrames.length; _i < _len; _i++) {
        frame = playbackFrames[_i];
        _results.push($(frame).attr("data-frame-id"));
      }
      return _results;
    })();
    ajaxOptions = {
      url: "save_frame_sequence",
      type: "POST",
      data: {
        animation_id: window.animationId,
        frame_sequence: frameSequence
      },
      dataType: "json"
    };
    done = function(response) {
      if (window.debug) {
        console.log("save frame sequence ajax, sent:", ajaxOptions, "response:", response);
      }
      if (response.success) {
        return console.log(response.message);
      }
    };
    return $.ajax(ajaxOptions).done(done);
  };

  clearPlayback = function() {
    if (window.debug) {
      console.log("clearPlayback");
    }
    return $("#playback_container *").removeClass().remove();
  };

  placeFrame = function(frameIndex, className) {
    var frame;
    if (className == null) {
      className = "";
    }
    if (window.debug) {
      console.log("placeFrame");
    }
    clearPlayback();
    frame = playbackFrames[frameIndex];
    $(frame).addClass(className);
    frame.id = "canvas";
    return $("#playback_container").append(frame);
  };

  rescanThumbnails = function() {
    var idsToSave;
    if (window.debug) {
      console.log("rescanThumbnails");
    }
    playbackFrames = [];
    idsToSave = [];
    $("#video_output *").each(function(index, thumbnail) {
      var frameId;
      frameId = $(thumbnail).attr("data-frame-id");
      playbackFrames.push(frameRegistry[frameId]);
      idsToSave.push(frameId);
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
  };

  trash = function(event) {
    if (window.debug) {
      console.log("trash");
    }
    $("#trash canvas").remove();
    $("#trash .sortable-placeholder").remove();
    rescanThumbnails();
    if (window.playbackIndex >= playbackFrames.length) {
      return frameEnd();
    }
  };

  window.play = function() {
    var beginningIndex, container, frame, index, interval, _i, _len;
    if (window.debug) {
      console.log("play");
    }
    if (window.isPlaying) {
      if (window.debug) {
        console.log("already playing, doing nothing");
      }
      return;
    }
    if (window.debug) {
      console.log("getting ready to play. length:", playbackFrames.length, "playback index", window.playbackIndex);
    }
    if (playbackFrames.length === window.playbackIndex + 1) {
      if (window.debug) {
        console.log("resetting to zero");
      }
      window.playbackIndex = 0;
      updateIndexView();
    }
    window.isPlaying = true;
    cameraOff();
    container = $("#video_container");
    interval = 1 / $("#fps").val() * 1000;
    beginningIndex = window.playbackIndex;
    for (index = _i = 0, _len = playbackFrames.length; _i < _len; index = ++_i) {
      frame = playbackFrames[index];
      if (index >= window.playbackIndex) {
        (function(frame, index) {
          var callback, delay;
          callback = function() {
            if (window.debug) {
              console.log("playback callback, index:", index);
            }
            if (window.debug) {
              console.log("play loop, index:", index, "delay:", delay);
            }
            placeFrame(index, playbackClass);
            if (playbackFrames.length === index + 1) {
              window.isPlaying = false;
            } else {
              window.playbackIndex = index + 1;
            }
            return updateIndexView();
          };
          delay = interval * (index - beginningIndex);
          playbackTimeouts[index] = setTimeout(callback, delay);
          if (window.debug) {
            return console.log("play loop, index:", index, "delay:", delay);
          }
        })(frame, index);
      }
    }
    if (playbackFrames.length === 0) {
      window.isPlaying = false;
      return $("#playback_container").append("<div class='frametext'>Empty</div>");
    }
  };

  pause = function() {
    var timeout, _i, _len, _results;
    if (!window.isPlaying) {
      return;
    }
    window.isPlaying = false;
    _results = [];
    for (_i = 0, _len = playbackTimeouts.length; _i < _len; _i++) {
      timeout = playbackTimeouts[_i];
      _results.push(clearTimeout(timeout));
    }
    return _results;
  };

  frameBack = function() {
    pause();
    if (window.playbackIndex === 0) {
      return;
    } else {
      window.playbackIndex -= 1;
    }
    placeFrame(window.playbackIndex, playbackClass);
    return updateIndexView();
  };

  frameForward = function() {
    var max;
    pause();
    max = playbackFrames.length - 1;
    if (window.playbackIndex === max) {
      return;
    } else {
      window.playbackIndex += 1;
    }
    placeFrame(window.playbackIndex, playbackClass);
    return updateIndexView();
  };

  frameBeginning = function() {
    pause();
    window.playbackIndex = 0;
    placeFrame(0, playbackClass);
    return updateIndexView();
  };

  frameEnd = function() {
    var max;
    pause();
    max = playbackFrames.length - 1;
    window.playbackIndex = max;
    placeFrame(max, playbackClass);
    return updateIndexView();
  };

  updateIndexView = function() {
    return $("#playback_index").get(0).value = window.playbackIndex;
  };

  startSimlite = function() {
    $('#controls_container').hide();
    $('#playback_container').hide();
    $('#video_container').hide();
    $('#simbutton').hide();
    $('#crop_buttons').hide();
    cameraOff();
    $('#container').show();
    $('#output').show();
    return $('#sambutton').show();
  };

  startSamlite = function() {
    $('#controls_container').show();
    $('#playback_container').show();
    $('#video_container').show();
    $('#simbutton').show();
    $('#crop_buttons').show();
    $('#container').hide();
    $('#output').hide();
    return $('#sambutton').hide();
  };

  openProject = function() {
    alert("open project");
    return console.log("openProject");
  };

}).call(this);
