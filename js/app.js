
$(function () {
    var timer = null,
        interval = 1000,
        value = 0;

    $("#toggle-realtime").change(function () {
        if ($(this).is(':checked')) {
            // Checkbox is checked..
            if (timer !== null) return;
            timer = setInterval(function () {
                console.log(++value);
            }, interval);
        } else {
            // Checkbox is not checked..
            clearInterval(timer);
            timer = null;
        }
    });

    $('[data-toggle="tooltip"]').tooltip();
});
