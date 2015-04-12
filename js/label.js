(function() {
    "use strict";

    z.createPauseLabel = createPauseLabel;
    z.createEraseLabel = createEraseLabel;


    var LBL_PAUSE = "p",
        LBL_ERASE = "x";


    function createPauseLabel(startS, endS) {
        return createLabel(startS, endS, LBL_PAUSE);
    }


    function createEraseLabel(startS, endS) {
        return createLabel(startS, endS, LBL_ERASE);
    }


    function createLabel(startS, endS, type) {
        var colour = null;

        initPos(startS, endS);

        if (type !== LBL_ERASE) {
            type = LBL_PAUSE;
        }


        function my() {
        }


        my.toString = function () {
            return [startS.toFixed(6), endS.toFixed(6), type].join("\t");
        };


        my.clone = function () {
            return createLabel(startS, endS, type);
        };


        my.startS = function (valS) {
            if (!arguments.length) {
                return startS;
            }

            startS = Math.max(0, Math.min(valS, endS - z.MIN_DUR_S));
            colour = null;

            return my;
        };


        my.endS = function (valS) {
            if (!arguments.length) {
                return endS;
            }

            endS = Math.max(startS + z.MIN_DUR_S, valS);
            colour = null;

            return my;
        };


        my.durS = function () {
            return endS - startS;
        };


        my.colour = function () {
            if (!colour) {
                var wavelength = my.durS() * 60 + 380;

                if (wavelength > 780) {
                    colour = [255, 0, 0];
                } else {
                    colour = wav2RGB(wavelength);
                }
            }

            return colour;
        };


        my.isPause = function () {
            return type === LBL_PAUSE;
        };


        my.isCut = function () {
            return type === LBL_ERASE;
        };


        my.setPause = function () {
            type = LBL_PAUSE;
        };


        my.setCut = function () {
            type = LBL_ERASE;
        };


        my.contains = function (posS) {
            if (startS <= posS && posS <= endS) {
                return true;
            }

            return false;
        };


        function initPos (aStartS, aEndS) {
            aEndS = Math.max(0, aEndS);
            aStartS = Math.max(0, Math.min(aStartS, aEndS));

            startS = aStartS;
            endS = aEndS;
        }


        return my;
    }


    // http://codingmess.blogspot.jp/2009/05/conversion-of-wavelength-in-nanometers.html
    function wav2RGB(wavelength) {
        var w = Math.floor(wavelength);

        var r, g, b;

        // colour
        if (w >= 380 && w < 440) {
            r = -(w - 440.) / (440. - 350.);
            g = 0.0;
            b = 1.0;
        } else if (w >= 440 && w < 490) {
            r = 0.0;
            g = (w - 440.) / (490. - 440.);
            b = 1.0;
        } else if (w >= 490 && w < 510) {
            r = 0.0;
            g = 1.0;
            b = -(w - 510.) / (510. - 490.);
        } else if (w >= 510 && w < 580) {
            r = (w - 510.) / (580. - 510.);
            g = 1.0;
            b = 0.0;
        } else if (w >= 580 && w < 645) {
            r = 1.0;
            g = -(w - 645.) / (645. - 580.);
            b = 0.0;
        } else if (w >= 645 && w <= 780) {
            r = 1.0;
            g = 0.0;
            b = 0.0;
        } else {
            r = 0.0;
            g = 0.0;
            b = 0.0;
        }

        // intensity correction
        var sss;

        if (w >= 380 && w < 420) {
            sss = 0.3 + 0.7 * (w - 350) / (420 - 350);
        } else if (w >= 420 && w <= 700) {
            sss = 1.0;
        } else if (w > 700 && w <= 780) {
            sss = 0.3 + 0.7 * (780 - w) / (780 - 700);
        } else {
            sss = 0.0;
        }

        sss *= 255;

        return [Math.floor(sss * r), Math.floor(sss * g), Math.floor(sss * b)];
    }
})();
