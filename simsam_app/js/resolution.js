function adjustStyle(width) {
    width = parseInt(width);
    if (width < 910) {
        $("#size-stylesheet").attr("href", "static/css/simsam_narrow.css");
    } else if ((width >= 911) && (width < 1210)) {
        $("#size-stylesheet").attr("href", "static/css/simsam_medium.css");
    } else {
       $("#size-stylesheet").attr("href", "static/css/simsam_wide.css"); 
    }
}

$(function() {
    adjustStyle($(this).width());
    $(window).resize(function() {
        adjustStyle($(this).width());
    });
});