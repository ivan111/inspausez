(function() {
    "use strict";

    window.z.Label = Label;
    window.z.LBL_PAUSE = "p";
    window.z.LBL_CUT = "x";


    var MIN_DUR_S = 0.1;


    function Label(startS, endS, type) {
        this.colour = null;
        this.initPos(startS, endS);

        if (type === z.LBL_CUT) {
            this.type = z.LBL_CUT;
        } else {
            this.type = z.LBL_PAUSE;
        }
    }


    Label.prototype.isPause = function () {
        return this.type === z.LBL_PAUSE;
    };


    Label.prototype.isCut = function () {
        return this.type === z.LBL_CUT;
    };


    Label.prototype.setPause = function () {
        this.type = z.LBL_PAUSE;
    };


    Label.prototype.setCut = function () {
        this.type = z.LBL_CUT;
    };


    Label.prototype.contains = function (posS) {
        if (this.startS <= posS && posS <= this.endS) {
            return true;
        }

        return false;
    };


    Label.prototype.shift = function (valS) {
        this.startS += valS;
        this.endS += valS;

        this.colour = null;
    };


    Label.prototype.setStartS = function (startS) {
        this.startS = Math.max(0, Math.min(startS, this.endS - MIN_DUR_S));
        this.colour = null;
    };


    Label.prototype.setEndS = function (endS) {
        this.endS = Math.max(this.startS + MIN_DUR_S, endS);
        this.colour = null;
    };


    Label.prototype.getDurS = function () {
        return this.endS - this.startS;
    };


    Label.prototype.getColour = function () {
        if (!this.colour) {
            var wavelength = this.getDurS() * 60 + 380;

            if (wavelength > 780) {
                this.colour = [255, 0, 0];
            } else {
                this.colour = wav2RGB(wavelength);
            }
        }

        return this.colour;
    };


    Label.prototype.initPos = function (startS, endS) {
        endS = Math.max(0, endS);
        startS = Math.max(0, Math.min(startS, endS));

        this.startS = startS;
        this.endS = endS;
    };


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
