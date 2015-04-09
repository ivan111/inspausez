(function() {
    "use strict";

    window.z.VOL_RATE = 768;
    window.z.calcVolume = calcVolume;
    window.z.getSubVolume = getSubVolume;


    function calcVolume(buffer) {
        var d = buffer.getChannelData(0);
        var rate = buffer.sampleRate;

        var volLen = Math.floor(buffer.length * z.VOL_RATE / rate);

        var vol = [];
        var prevEnd = 0;

        for (var i = 0; i < volLen; i++) {
            var start = prevEnd;
            var end = Math.floor((i + 1) * rate / z.VOL_RATE);
            end = Math.min(end, buffer.length);

            vol.push(calcRMS(d, start, end));

            prevEnd = end;
        }

        return vol;
    }


    function getSubVolume(startS, endS, scale) {
        var startF = Math.floor(startS * z.VOL_RATE);
        var endF = Math.floor(endS * z.VOL_RATE);

        var ret;

        if (scale === 1) {
            ret = z.vol.slice(startF, endF);
        } else {
            ret = [];

            for (var f = startF; f < endF; f += scale) {
                ret.push(z.vol[f]);
            }
        }

        return ret;
    }


    function calcRMS(data, start, end) {
        var sum = 0;

        for (var i = start; i < end; i++) {
            sum += data[i] * data[i];
        }

        return Math.sqrt(sum / (end - start));
    }
})();
