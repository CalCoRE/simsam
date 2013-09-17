// Generated by CoffeeScript 1.6.3
(function() {
<<<<<<< HEAD
<<<<<<< HEAD
  $(function() {
    var anyCamera, cameraOff, cameraOn, cameraState, cameraSwitch, capture, clearPlayback, frameBack, frameBeginning, frameEnd, frameForward, frameRegistry, getRandomId, loadFrames, loadSprites, makeUnselectable, menu, overlayClass, pause, placeBlankFrame, placeFrame, playbackClass, playbackTimeouts, recording, rescanThumbnails, saveCanvas, saveFrameSequence, startSamlite, startSimlite, thumbnailScaleFactor, toggleCamera, toggleMenu, toggleMode, trash;
    thumbnailScaleFactor = 0.25;
    cameraSwitch = {};
    window.playbackFrames = [];
    frameRegistry = {};
    playbackTimeouts = [];
    overlayClass = "overlay-frame";
    playbackClass = "playback-frame";
    window.isPlaying = false;
    window.playbackIndex = 0;
    window.debug = true;
    menu = false;
    recording = true;
    cameraState = 1;
    anyCamera = true;
    window.spritecollection = [];
    window.initSam = function() {
      var element, failure, success, _i, _j, _len, _len1, _ref, _ref1;
      $('#sambutton').hide();
      $('#container').hide();
      $('#output').hide();
      $('#right_frame').hide();
      $('#savecrop').hide();
      $('#cancelcrop').hide();
      window.camera = $("#camera").get(0);
      $("#replay").click(function() {
        if (recording) {
          return shoot();
        } else {
          return play();
        }
      });
      $("#simbutton").click(startSimlite);
      $("#sambutton").click(startSamlite);
      $("#right_menu_button").click(toggleMenu);
      $("#play_mode").click(play);
      $("#record_mode").click(toggleMode);
      $("#video_output").sortable().bind('sortupdate', rescanThumbnails);
      $("#video_output").sortable().bind('sortupdate', saveFrameSequence);
      $("#trash").sortable({
        connectWith: "#video_output"
      }).bind('receive', trash);
      makeUnselectable($(document.body).get(0));
      _ref = window.spritecollection;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        element = _ref[_i];
        loadSprites(element);
      }
      _ref1 = window.framesequence;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        element = _ref1[_j];
        loadFrames(element);
      }
      if (playbackFrames.length === 0) {
        $('#startcropping').hide();
      }
      if (html5support.getUserMedia()) {
        console.log("user media available");
        success = function(stream) {
          console.log("success");
          camera.src = stream;
          camera.play();
          return switchToRecordMode();
        };
        failure = function(error) {
          console.log("failure");
          alert(JSON.stringify(error));
          window.playbackIndex = 0;
          return switchToPlaybackMode();
        };
        return navigator.getUserMedia({
          audio: true,
          video: true
        }, success, failure);
      } else {
        anyCamera = false;
=======
=======
>>>>>>> 3be1a2edb45438d0edc13e15aaf4dae678a573c6
  var anyCamera, cameraOff, cameraOn, cameraState, cameraSwitch, capture, clearPlayback, frameBack, frameBeginning, frameEnd, frameForward, frameRegistry, getRandomId, loadFrames, loadSprites, makeUnselectable, menu, overlayClass, pause, placeBlankFrame, placeFrame, playbackClass, playbackTimeouts, recording, rescanThumbnails, saveCanvas, saveFrameSequence, switchToSam, switchToSim, thumbnailScaleFactor, toggleCamera, toggleMenu, toggleMode, trash;

  thumbnailScaleFactor = 0.25;

  cameraSwitch = {};

  window.playbackFrames = [];

  frameRegistry = {};

  playbackTimeouts = [];

  overlayClass = "overlay-frame";

  playbackClass = "playback-frame";

  window.isPlaying = false;

  window.playbackIndex = 0;

  window.playbackInterval = 200;

  window.debug = true;

  menu = false;

  recording = true;

  cameraState = 1;

  anyCamera = true;

  window.spritecollection = [];

  $(document).ready(function() {
    var element, failure, success, _i, _j, _len, _len1, _ref, _ref1;
    $('#switch_to_sam_button').hide();
    $('#sim_buttons').hide();
    $('#container').hide();
    $('#output').hide();
    $('#right_frame').hide();
    $('#savecrop').hide();
    $('#cancelcrop').hide();
    window.camera = $("#camera").get(0);
    $("#replay").click(function() {
      if (recording) {
        return shoot();
      } else {
        return play();
      }
    });
    $("#switch_to_sim_button").click(switchToSim);
    $("#switch_to_sam_button").click(switchToSam);
    $("#right_menu_button").click(toggleMenu);
    $("#play_mode").click(play);
    $("#record_mode").click(toggleMode);
    $("#video_output").sortable().bind('sortupdate', rescanThumbnails);
    $("#video_output").sortable().bind('sortupdate', saveFrameSequence);
    $("#trash").sortable({
      connectWith: "#video_output"
    }).bind('receive', trash);
    makeUnselectable($(document.body).get(0));
    _ref = window.spritecollection;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      element = _ref[_i];
      loadSprites(element);
    }
    _ref1 = window.framesequence;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      element = _ref1[_j];
      loadFrames(element);
    }
    if (playbackFrames.length === 0) {
      $('#startcropping').hide();
    }
    if (html5support.getUserMedia()) {
      console.log("user media available");
      success = function(stream) {
        console.log("success");
        camera.src = stream;
        camera.play();
        return switchToRecordMode();
      };
      failure = function(error) {
        console.log("failure");
        alert(JSON.stringify(error));
>>>>>>> 3be1a2edb45438d0edc13e15aaf4dae678a573c6
        window.playbackIndex = 0;
        switchToPlaybackMode();
        $("#record_mode").css('display', 'none');
        return alert("Your browser will not allow SiMSAM to use the webcam. Related functions will be disabled.");
      }
    };
    loadSprites = function(sprite) {
      var img, output;
      output = $("#sprite_drawer").get(0);
      img = new Image();
      img.src = 'http://' + window.location.host + '/media/sprites/' + sprite + '.jpg';
      img.className = "sprite";
      return output.appendChild(img);
    };
    loadFrames = function(frame) {
      var canvas, context, ctx, frameId, frameIndex, frameOrdinal, img, output, thumb, thumbnail;
      output = $("#video_output").get(0);
      canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d');
      img = new Image();
      img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        return ctx.drawImage(img, 0, 0, img.width, img.height);
      };
      img.src = 'http://' + window.location.host + '/media/sam_frames/' + frame + '.jpg';
      frameOrdinal = playbackFrames.push(canvas);
      thumbnail = document.createElement('canvas');
      context = thumbnail.getContext('2d');
      thumb = new Image();
      thumb.onload = function() {
        thumbnail.width = thumb.width * thumbnailScaleFactor;
        thumbnail.height = thumb.height * thumbnailScaleFactor;
        return context.drawImage(thumb, 0, 0, thumbnail.width, thumbnail.height);
      };
      thumb.src = 'http://' + window.location.host + '/media/sam_frames/' + frame + '.jpg';
      frameId = frameIndex = frameOrdinal - 1;
      $(thumbnail).attr("data-frame-id", frame);
      $(canvas).attr("data-frame-id", frame);
      frameRegistry[frame] = canvas;
      output.appendChild(thumbnail);
      $("#video_output").sortable("refresh");
      rescanThumbnails();
      return placeFrame(frameIndex, (recording ? overlayClass : playbackClass));
    };
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
      if (cameraState === 0) {
        return cameraOn;
      } else {
        return cameraOff;
      }
    };
    cameraOn = function() {
      if (window.debug) {
        console.log("toggle camera on");
      }
      clearPlayback();
      cameraState = 1;
      return $(camera).css("display", "block");
    };
    cameraOff = function() {
      if (window.debug) {
        console.log("toggle camera off");
      }
      $(camera).css("display", "none");
      cameraState = 0;
      return placeFrame(window.playbackIndex);
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
    getRandomId = function() {
      var possible, text, x, _i;
      possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      text = '';
      for (x = _i = 1; _i <= 5; x = ++_i) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return 'tempFrameId_' + text;
    };
    window.shoot = function() {
      var frame, frameId, frameIndex, output, thumbnail, video;
      pause();
      clearPlayback();
      video = $("#camera").get(0);
      console.log(video);
      output = $("#video_output").get(0);
      frame = capture(video, 1);
      thumbnail = capture(video, thumbnailScaleFactor);
      console.log("shot frame");
      console.log(frame);
      if (playbackFrames.length === 0) {
        playbackFrames[0] = frame;
        frameId = frameIndex = 0;
      } else {
        frameIndex = playbackIndex + 1;
        frameId = getRandomId();
        playbackFrames.splice(frameIndex, 0, frame);
      }
      $(thumbnail).attr("data-frame-id", frameId);
      $(frame).attr("data-frame-id", frameId);
      frameRegistry[frameId] = frame;
      console.log("frameRegistry");
      console.log(frameRegistry);
      console.log("playbackFrames");
      console.log(playbackFrames);
      if (playbackFrames.length > 1) {
        $("#video_output canvas:eq(" + playbackIndex + ")").after(thumbnail);
      } else {
        output.appendChild(thumbnail);
      }
      $("#video_output").sortable("refresh");
      rescanThumbnails();
      placeFrame(frameIndex, overlayClass);
      window.playbackIndex = frameIndex;
      $('#startcropping').show();
      return saveCanvas(frame, frameId);
    };
    saveCanvas = function(canvas, tempId) {
      var ajaxOptions, done, imageString, imageStringRaw;
      imageStringRaw = canvas.toDataURL("image/jpeg");
      imageString = imageStringRaw.replace("data:image/jpeg;base64,", "");
      if (window.debug) {
        console.log("savecanvas", window.animationId);
      }
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
      return $("#replay *").removeClass().remove();
    };
<<<<<<< HEAD
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
      return $("#replay").append(frame);
    };
    placeBlankFrame = function() {
      return $("#replay").append('<div class="blank-frame"><div>nothing here</div></div>');
    };
    rescanThumbnails = function() {
      var idsToSave;
      if (window.debug) {
        console.log("rescanThumbnails");
      }
      window.playbackFrames = [];
      idsToSave = [];
      return $("#video_output *").each(function(index, thumbnail) {
        var frameId;
        frameId = $(thumbnail).attr("data-frame-id");
        window.playbackFrames.push(frameRegistry[frameId]);
        idsToSave.push(frameId);
        return $(thumbnail).unbind("click").click(function() {
          pause();
          placeFrame(index, (recording ? overlayClass : playbackClass));
          return window.playbackIndex = index;
        });
      });
    };
    trash = function(event) {
      var max;
      if (window.debug) {
        console.log("trash");
      }
      $("#trash canvas").remove();
      $("#trash .sortable-placeholder").remove();
      rescanThumbnails();
      if (window.playbackIndex >= playbackFrames.length) {
        max = playbackFrames.length - 1;
        window.playbackIndex = max;
        if (recording) {
          if (window.playbackFrames.length > 0) {
            placeFrame(max, overlayClass);
          } else {
            clearPlayback();
          }
=======
    return $.ajax(ajaxOptions).done(done);
  };

  clearPlayback = function() {
    if (window.debug) {
      console.log("clearPlayback");
    }
    return $("#replay *").removeClass().remove();
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
    return $("#replay").append(frame);
  };

  placeBlankFrame = function() {
    return $("#replay").append('<div class="blank-frame"><div>nothing here</div></div>');
  };

  rescanThumbnails = function() {
    var idsToSave;
    if (window.debug) {
      console.log("rescanThumbnails");
    }
    window.playbackFrames = [];
    idsToSave = [];
    $("#video_output *").each(function(index, thumbnail) {
      var frameId;
      frameId = $(thumbnail).attr("data-frame-id");
      window.playbackFrames.push(frameRegistry[frameId]);
      idsToSave.push(frameId);
      return $(thumbnail).unbind("click").click(function() {
        pause();
        placeFrame(index, (recording ? overlayClass : playbackClass));
        return window.playbackIndex = index;
      });
    });
    if (playbackFrames.length === 0) {
      return $('#startcropping').hide();
    } else {
      return $('#startcropping').show();
    }
  };

  trash = function(event) {
    var max;
    if (window.debug) {
      console.log("trash");
    }
    $("#trash canvas").remove();
    $("#trash .sortable-placeholder").remove();
    rescanThumbnails();
    if (window.playbackIndex >= playbackFrames.length) {
      max = playbackFrames.length - 1;
      window.playbackIndex = max;
      if (recording) {
        if (window.playbackFrames.length > 0) {
          placeFrame(max, overlayClass);
        } else {
          clearPlayback();
        }
      } else {
        if (window.playbackFrames.length > 0) {
          placeFrame(max, playbackClass);
>>>>>>> 3be1a2edb45438d0edc13e15aaf4dae678a573c6
        } else {
          if (window.playbackFrames.length > 0) {
            placeFrame(max, playbackClass);
          } else {
            clearPlayback();
            placeBlankFrame();
          }
        }
      }
<<<<<<< HEAD
      return saveFrameSequence();
    };
    window.play = function() {
      var beginningIndex, container, frame, index, interval, _i, _len;
=======
    }
    return saveFrameSequence();
  };

  window.play = function() {
    var beginningIndex, container, frame, index, _i, _len;
    if (window.debug) {
      console.log("play");
    }
    if (window.isPlaying) {
>>>>>>> 3be1a2edb45438d0edc13e15aaf4dae678a573c6
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
<<<<<<< HEAD
      if (playbackFrames.length === window.playbackIndex + 1) {
        if (window.debug) {
          console.log("resetting to zero");
        }
        window.playbackIndex = 0;
      }
      window.isPlaying = true;
      container = $("#video_frame");
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
                return window.isPlaying = false;
              } else {
                return window.playbackIndex = index + 1;
              }
            };
            delay = interval * (index - beginningIndex);
            playbackTimeouts[index] = setTimeout(callback, delay);
=======
      window.playbackIndex = 0;
    }
    window.isPlaying = true;
    container = $("#video_frame");
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
>>>>>>> 3be1a2edb45438d0edc13e15aaf4dae678a573c6
            if (window.debug) {
              return console.log("play loop, index:", index, "delay:", delay);
            }
<<<<<<< HEAD
          })(frame, index);
        }
      }
      if (playbackFrames.length === 0) {
        return window.isPlaying = false;
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
      return placeFrame(window.playbackIndex, playbackClass);
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
      return placeFrame(window.playbackIndex, playbackClass);
    };
    frameBeginning = function() {
      pause();
      window.playbackIndex = 0;
      return placeFrame(0, playbackClass);
    };
    frameEnd = function() {
      var max;
      pause();
      max = playbackFrames.length - 1;
      window.playbackIndex = max;
      if (window.playbackFrames.length > 0) {
        return placeFrame(max, playbackClass);
      } else {
        clearPlayback();
        return placeBlankFrame();
      }
    };
    startSimlite = function() {
      $('#replay').hide();
      $('#video_frame').hide();
      $('#bottom_frame').hide();
      $('#simbutton').hide();
      $('#crop_buttons').hide();
      $('#container').show();
      $('#output').show();
      $('#sambutton').show();
      return window.loadSpriteTypes();
    };
    startSamlite = function() {
      $('#controls_container').show();
      $('#replay').show();
      $('#video_frame').show();
      $('#simbutton').show();
      $('#crop_buttons').show();
      $('#bottom_frame').show();
      $('#container').hide();
      $('#output').hide();
      return $('#sambutton').hide();
    };
    toggleMenu = function() {
      if (menu) {
        $('#right_frame').hide("slide", {
          direction: "right"
        }, 500);
        $('#construction_frame').animate({
          right: '0px'
        }, 500);
        $('#right_menu_button').css("image", "../images/openmenu.png");
        $('#right_menu_button').animate({
          right: '5px'
        }, 500);
        return menu = false;
      } else {
        $('#right_frame').show("slide", {
          direction: "right"
        }, 500);
        $('#construction_frame').animate({
          right: '200px'
        }, 500);
        $('#right_menu_button').css("image", "../images/closemenu.png");
        $('#right_menu_button').animate({
          right: '205px'
        }, 500);
        return menu = true;
      }
    };
    toggleMode = function() {
      if (!anyCamera) {
        return;
      }
      if (recording) {
        return switchToPlaybackMode();
      } else {
        return switchToRecordMode();
      }
    };
    window.switchToRecordMode = function() {
      console.log("switchToRecordMode()");
      recording = true;
      if (playbackFrames.length > 0) {
        placeFrame(window.playbackIndex, overlayClass);
      } else {
        clearPlayback();
      }
      $('#record_mode').removeClass('small').addClass('big');
      $('#play_mode').removeClass('big').addClass('small');
      $('#play_mode').unbind('click').click(toggleMode);
      return $('#record_mode').unbind('click').click(shoot);
    };
    return window.switchToPlaybackMode = function() {
      console.log("switchToPlaybackMode()");
      recording = false;
      if (playbackFrames.length > 0) {
        placeFrame(window.playbackIndex, playbackClass);
      } else {
        placeBlankFrame();
      }
      $('#play_mode').removeClass('small').addClass('big');
      $('#record_mode').removeClass('big').addClass('small');
      $('#play_mode').unbind('click').click(play);
      return $('#record_mode').unbind('click').click(toggleMode);
    };
  });
=======
          };
          delay = window.playbackInterval * (index - beginningIndex);
          playbackTimeouts[index] = setTimeout(callback, delay);
          if (window.debug) {
            return console.log("play loop, index:", index, "delay:", delay);
          }
        })(frame, index);
      }
    }
    if (playbackFrames.length === 0) {
      return window.isPlaying = false;
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
    return placeFrame(window.playbackIndex, playbackClass);
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
    return placeFrame(window.playbackIndex, playbackClass);
  };

  frameBeginning = function() {
    pause();
    window.playbackIndex = 0;
    return placeFrame(0, playbackClass);
  };

  frameEnd = function() {
    var max;
    pause();
    max = playbackFrames.length - 1;
    window.playbackIndex = max;
    if (window.playbackFrames.length > 0) {
      return placeFrame(max, playbackClass);
    } else {
      clearPlayback();
      return placeBlankFrame();
    }
  };

  switchToSim = function() {
    $('#replay').hide();
    $('#video_frame').hide();
    $('#bottom_frame').hide();
    $('#crop_buttons').hide();
    $('#switch_to_sim_button').hide();
    $('#sim_buttons').show();
    $('#container').show();
    $('#output').show();
    $('#switch_to_sam_button').show();
    return window.loadSpriteTypes();
  };

  switchToSam = function() {
    $('#controls_container').show();
    $('#replay').show();
    $('#video_frame').show();
    $('#crop_buttons').show();
    $('#bottom_frame').show();
    $('#switch_to_sim_button').show();
    $('#sim_buttons').hide();
    $('#container').hide();
    $('#output').hide();
    return $('#switch_to_sam_button').hide();
  };

  toggleMenu = function() {
    if (menu) {
      $('#right_frame').hide("slide", {
        direction: "right"
      }, 500);
      $('#construction_frame').animate({
        right: '0px'
      }, 500);
      $('#right_menu_button').css("image", "../images/openmenu.png");
      $('#right_menu_button').animate({
        right: '5px'
      }, 500);
      return menu = false;
    } else {
      $('#right_frame').show("slide", {
        direction: "right"
      }, 500);
      $('#construction_frame').animate({
        right: '200px'
      }, 500);
      $('#right_menu_button').css("image", "../images/closemenu.png");
      $('#right_menu_button').animate({
        right: '205px'
      }, 500);
      return menu = true;
    }
  };

  toggleMode = function() {
    if (!anyCamera) {
      return;
    }
    if (recording) {
      return switchToPlaybackMode();
    } else {
      return switchToRecordMode();
    }
  };

  window.switchToRecordMode = function() {
    console.log("switchToRecordMode()");
    recording = true;
    if (playbackFrames.length > 0) {
      placeFrame(window.playbackIndex, overlayClass);
    } else {
      clearPlayback();
    }
    $('#record_mode').removeClass('small').addClass('big');
    $('#play_mode').removeClass('big').addClass('small');
    $('#play_mode').unbind('click').click(toggleMode);
    return $('#record_mode').unbind('click').click(shoot);
  };

  window.switchToPlaybackMode = function() {
    console.log("switchToPlaybackMode()");
    recording = false;
    if (playbackFrames.length > 0) {
      placeFrame(window.playbackIndex, playbackClass);
    } else {
      placeBlankFrame();
    }
    $('#play_mode').removeClass('small').addClass('big');
    $('#record_mode').removeClass('big').addClass('small');
    $('#play_mode').unbind('click').click(play);
    return $('#record_mode').unbind('click').click(toggleMode);
  };
>>>>>>> 3be1a2edb45438d0edc13e15aaf4dae678a573c6

}).call(this);
