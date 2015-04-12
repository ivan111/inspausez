// http://typedarray.org/from-microphone-to-wav-with-getusermedia-and-web-audio/
(function() {
    "use strict";

    z.createWavBlob = createWavBlob;


    function createWavBlob() {
        if (!z.buffer) {
            return null;
        }

        var srcBuffer = createLabelsBuffer();
        var rate = srcBuffer.sampleRate;
        var nCh = srcBuffer.numberOfChannels;
        var chunk;

        if (nCh === 1) {
            chunk = srcBuffer.getChannelData(0);
        } else {
            chunk = interleave(srcBuffer.getChannelData(0), srcBuffer.getChannelData(1));
        }

        var chunkSize = chunk.length * 2;
        var buffer = new ArrayBuffer(44 + chunk.length * 2);
        var view = new DataView(buffer);

        // RIFF chunk descriptor
        writeUTFBytes(view, 0, "RIFF");
        view.setUint32(4, 44 + chunkSize, true);
        writeUTFBytes(view, 8, "WAVE");

        // FMT sub-chunk
        writeUTFBytes(view, 12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);

        view.setUint16(22, nCh, true);
        view.setUint32(24, rate, true);
        view.setUint32(28, rate * 2 * nCh, true);
        view.setUint16(32, 2 * nCh, true);
        view.setUint16(34, 16, true);

        // data sub-chunk
        writeUTFBytes(view, 36, "data");
        view.setUint32(40, chunkSize, true);

        // write the PCM samples
        var index = 44;

        for (var i = 0; i < chunk.length; i++) {
            view.setInt16(index, chunk[i] * 0x7FFF, true);
            index += 2;
        }

        return new window.Blob([view], { type: "audio/wav" });
    }


    function interleave(ch1, ch2) {
        var result = new Float32Array(ch1.length * 2);
        var k = 0;

        for (var i = 0; i < ch1.length; i++) {
            result[k++] = ch1[i];
            result[k++] = ch2[i];
        }

        return result;
    }


    function writeUTFBytes(view, offset, string) {
        var len = string.length;

        for (var i = 0; i < len; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }


    function createLabelsBuffer() {
        var srcBuffer = z.buffer;
        var len = srcBuffer.length;
        var rate = srcBuffer.sampleRate;
        var nCh = srcBuffer.numberOfChannels;

        for (var i = 0; i < z.labels.length; i++) {
            var label = z.labels[i];

            if (label.isPause()) {
                len += Math.floor(z.calcPauseS(label.durS()) * rate);
            }
        }

        var buffer = z.context.createBuffer(nCh, len, rate);

        for (var iCh = 0; iCh < nCh; iCh++) {
            var srcData = srcBuffer.getChannelData(iCh);
            var srcPos = 0;

            var d = buffer.getChannelData(iCh);
            var dPos = 0;

            for (i = 0; i < z.labels.length; i++) {
                label = z.labels[i];

                if (label.isPause()) {
                    // sound
                    var num = Math.floor(label.endS() * rate) - srcPos;
                    copyArray(d, dPos, srcData, srcPos, num);
                    dPos += num;
                    srcPos += num;

                    // pause
                    num = Math.floor(z.calcPauseS(label.durS()) * rate);
                    setZeroArray(d, dPos, num);
                    dPos += num;
                }
            }

            if (dPos < len) {
                // sound
                num = len - srcPos;
                copyArray(d, dPos, srcData, srcPos, num);
            }
        }

        return buffer;
    }


    function copyArray(dst, dstPos, src, srcPos, num) {
        while (--num >= 0) {
            dst[dstPos++] = src[srcPos++];
        }
    }


    function setZeroArray(dst, dstPos, num) {
        while (--num >= 0) {
            dst[dstPos++] = 0;
        }
    }
})();
