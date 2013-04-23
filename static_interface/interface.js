recording = false;
menu = false;

var toggleMode = function() {
  if (recording) {
    $('#play_mode').removeClass('small').addClass('big');
    $('#record_mode').removeClass('big').addClass('small');
    return recording = false;
  } else {
    $('#record_mode').removeClass('small').addClass('big');
    $('#play_mode').removeClass('big').addClass('small');
    return recording = true;
  }
};

var toggleMenu = function() {
  if (menu) {
    $('#right_frame').hide();
    $('#construction_frame').css("right", "0px");
    $('#right_menu_button').css("image", "images/openmenu.png");
    $('#right_menu_button').css("right", "5px");
    return menu = false;
  } else {
    $('#right_frame').show();
    $('#construction_frame').css("right", "200px");
    $('#right_menu_button').css("image", "images/closemenu.png");
    $('#right_menu_button').css("right", "205px");
    return menu = true;
  }
};