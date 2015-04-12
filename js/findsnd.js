(function() {
    "use strict";

    z.findSound = findSound;


    function findSound(vol, silLv, silDurS, sndDurS, beforeDurS, afterDurS) {
        silLv = typeof silLv !== "undefined" ? silLv : z.SIL_LV;
        silDurS = typeof silDurS !== "undefined" ? silDurS : z.SIL_DUR_S;
        sndDurS = typeof sndDurS !== "undefined" ? sndDurS : z.SND_DUR_S;
        beforeDurS = typeof beforeDurS !== "undefined" ? beforeDurS : z.BEFORE_DUR_S;
        afterDurS = typeof afterDurS !== "undefined" ? afterDurS : z.AFTER_DUR_S;

        var durS = vol.length / z.VOL_RATE;

        silLv = Math.max(0, Math.min(silLv, 100));

        var maxVal = Math.max.apply(null, vol);
        var thres = silLv * maxVal / 100;
        var silF = silDurS * z.VOL_RATE;
        var sndF = sndDurS * z.VOL_RATE;
        var silC = 0;
        var sndC = 0;
        var silStart = -1;
        var sndStart = -1;
        var isFirstSnd = true;
        var labels = z.createLabels();

        for (var n = 0; n < vol.length; n++) {
            var v = vol[n];

            if (v <= thres) {
                silC++;

                if (silStart === -1) {
                    silStart = n;
                } else if ((!isFirstSnd) && (sndStart !== -1) && (silC > silF) && (sndC > sndF)) {
                    var maxF = silStart + Math.floor(afterDurS * z.VOL_RATE);
                    silF = getSilF(vol, silStart, thres, maxF);
                    var startTime = (sndStart / z.VOL_RATE) - beforeDurS;
                    startTime = Math.max(0, Math.min(startTime, durS));
                    var endTime = (silStart + silF) / z.VOL_RATE;
                    endTime = Math.max(0, Math.min(endTime, durS));

                    labels.push(z.createPauseLabel(startTime, endTime));

                    isFirstSnd = true;
                    silC = 0;
                    sndC = 0;
                    silStart = -1;
                }
            } else {
                sndC++;

                if (isFirstSnd) {
                    isFirstSnd = false;
                    sndStart = n;
                }

                silC = 0;
                silStart = -1;
            }
        }

        if (!isFirstSnd) {
            startTime = (sndStart / z.VOL_RATE) - beforeDurS;
            startTime = Math.max(0, Math.min(startTime, durS));
            endTime = silStart / z.VOL_RATE + afterDurS;
            endTime = Math.max(0, Math.min(endTime, durS));

            if (endTime < startTime) {
                endTime = durS;
            }

            labels.push(z.createPauseLabel(startTime, endTime));
        }

        return labels;
    }


    function getSilF(data, startF, thres, maxF) {
        if (data.length < maxF) {
            maxF = data.length;
        }

        var silC = 0;

        for (var i = startF; i < maxF; i++) {
            if (data[i] <= thres) {
                silC++;
            } else {
                break;
            }
        }

        return silC;
    }
})();
