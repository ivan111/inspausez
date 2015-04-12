(function() {
    "use strict";

    z.viewport = viewport;


    var MAX_SCALE = 8;


    function viewport(width, rate, onChange) {
        var startS = 0;
        var scale = 4;
        var endS = null;
        var maxEndS = (width * scale) / rate;


        function my() {
        }


        my.startS = function (value) {
            if (!arguments.length) {
                return startS;
            }

            var widthS = (width * scale) / rate;
            var maxStartS = maxEndS - widthS;

            var prevStartS = startS;

            startS = Math.max(0, Math.min(value, maxStartS));
            endS = null;

            if (prevStartS !== startS) {
                onChange();
            }

            return my;
        };


        my.scale = function () {
            return scale;
        };


        my.endS = function () {
            if (!endS) {
                var s = (width * scale) / rate;

                endS = Math.min(startS + s, maxEndS);
            }

            return endS;
        };


        my.maxEndS = function (value) {
            if (!arguments.length) {
                return maxEndS;
            }

            maxEndS = value;
            endS = null;

            return my;
        };


        my.durS = function () {
            return my.endS() - startS;
        };


        my.isVisible = function (sec1, sec2) {
            var eS = my.endS();

            // vertical line
            if (arguments.length === 1) {
                return (startS <= sec1 && sec1 <= eS);
            }

            // rectangle

            if (sec2 < startS) {
                return false;
            }

            if (sec1 > eS) {
                return false;
            }

            if (startS <= sec1 && sec1 <= eS) {
                return true;
            }

            if (startS <= sec2 && sec2 <= eS) {
                return true;
            }

            if (sec1 <= startS && startS <= sec2
                    && sec1 <= eS && eS <= sec2) {
                return true;
            }

            return false;
        };


        my.range = function () {
            return [startS, my.endS()];
        };


        // -------------------------------------------------------------------
        // zoom


        my.canZoomIn = function () {
            return scale !== 1;
        };


        my.zoomIn = function () {
            if (!my.canZoomIn()) {
                return;
            }

            scale /= 2;
            endS = null;

            onChange();
        };


        my.canZoomOut = function () {
            return scale <= MAX_SCALE;
        };


        my.zoomOut = function () {
            if (!my.canZoomOut()) {
                return;
            }

            scale *= 2;
            endS = null;

            onChange();
        };


        // -------------------------------------------------------------------
        // converter

        my.sec2x = function (sec) {
            return Math.floor((sec - startS) * rate / scale);
        };


        my.sec2width = function (sec) {
            return Math.floor(sec * rate / scale);
        };


        my.x2sec = function (x) {
            return startS + (x * scale / rate);
        };


        my.width2sec = function (w) {
            return w * scale / rate;
        };


        my.sec2ax = function (sec) {
            return Math.floor(sec * width / maxEndS);
        };


        my.ax2sec = function (x) {
            return x * maxEndS / width;
        };


        return my;
    }
})();
