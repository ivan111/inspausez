(function() {
    "use strict";

    window.z.audio = {
        getContext: getContext,
        load: load
    };


    function getContext() {
        var ContextClass = (window.AudioContext ||
            window.webkitAudioContext ||
            window.mozAudioContext ||
            window.oAudioContext ||
            window.msAudioContext);

        var context = null;

        if (ContextClass) {
            context = new ContextClass();
        }

        return context;
    }


    function load(context, url, onload) {
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        request.onload = function() {
            context.decodeAudioData(request.response, function(buffer) {
                onload(buffer);
            }, function () {
                window.alert("error");
            });
        };

        request.send();
    }
})();
