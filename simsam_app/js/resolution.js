function adjustStyle(width) {
    width = parseInt(width);
    if (width < 910) {
        $("#size-stylesheet").attr("href", "static/css/narrow.css");
    } else if ((width >= 911) && (width < 1210)) {
        $("#size-stylesheet").attr("href", "static/css/medium.css");
    } else {
       $("#size-stylesheet").attr("href", "static/css/wide.css"); 
    }
}

$(function() {
    adjustStyle($(this).width());
    $(window).resize(function() {
        adjustStyle($(this).width());
    });
});