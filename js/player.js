(function() {
    "use strict";

    window.z.player = {
        canPlay: canPlay,
        play: play,
        playPause: playPause,
        canPause: canPause,
        pause: pause,
        changeVolume: changeVolume,
        onChange: null
    };


    var TYPE_PLAY = 1,
        TYPE_PAUSE = 2,
        tbl = [],
        tblPos,
        timerId;


    function setLabels() {
        tbl = [];
        tblPos = 0;

        var pos = 0;

        for (var i = 0; i < z.labels.length; i++) {
            var label = z.labels[i];

            if (label.isPause()) {
                tbl.push({ type: TYPE_PLAY, offset: pos, dur: label.endS - pos });
                pos = label.endS;

                tbl.push({ type: TYPE_PAUSE, offset: pos, dur: label.getDurS() });
            }
        }
    }


    function canPlay() {
        return !z.isPlaying && !z.isAudioPlaying;
    }


    function canPause() {
        return z.isPlaying || z.isAudioPlaying;
    }


    function play() {
        if (!canPlay()) {
            return;
        }

        tbl = [{ type: TYPE_PLAY, offset: 0, dur: z.durS }];
        tblPos = 0;

        subPlay(true);
    }


    function playPause() {
        if (!canPlay()) {
            return;
        }

        setLabels();

        searchCurTblPos();

        subPlay(true);
    }


    function searchCurTblPos() {
        for (var i = 0; i < tbl.length; i++) {
            var d = tbl[i];

            if (d.type === TYPE_PLAY && d.offset <= z.curS && z.curS < d.offset + d.dur) {
                tblPos = i;
                return;
            }
        }
    }


    function subPlay(isFirst) {
        if (tblPos >= tbl.length) {
            tblPos = 0;
            z.curS = 0;
        }

        z.isPlaying = true;

        var d = tbl[tblPos];

        var offset = d.offset;
        var dur = d.dur;

        if (isFirst && d.type === TYPE_PLAY && z.curS !== d.offset) {
            offset = z.curS;
            dur -= z.curS - d.offset;
        }

        z.offsetTime = offset;

        if (d.type === TYPE_PLAY) {
            playAudio(offset, dur);
        } else {
            playSilence(dur);
        }
    }


    function playAudio(offset, dur) {
        z.source = z.context.createBufferSource();
        z.source.buffer = z.buffer;
        z.source.onended = onEnded;

        z.gainNode = z.context.createGain();
        z.gainNode.gain.value = z.curGain;

        z.source.connect(z.gainNode);
        z.gainNode.connect(z.context.destination);

        z.source.start(0, offset, dur);

        z.startTime = z.context.currentTime;
        z.isAudioPlaying = true;
        timerId = setInterval(z.player.onChange, 20);
    }


    function changeVolume(element) {
        var fraction = parseInt(element.value) / parseInt(element.max);
        z.curGain = fraction * fraction;

        if (z.gainNode) {
            z.gainNode.gain.value = z.curGain;
        }
    }


    function playSilence(dur) {
        setTimeout(onEnded, Math.floor(dur * 1000));
    }


    function pause() {
        z.isPlaying = false;

        if (z.isAudioPlaying) {
            z.isAudioPlaying = false;
            clearInterval(timerId);
            z.source.stop();
            z.curS = z.offsetTime + z.context.currentTime - z.startTime;
        }
    }


    function onEnded() {
        tblPos++;

        z.gainNode = null;
        z.player.onChange();

        if (z.isAudioPlaying) {
            z.isAudioPlaying = false;
            clearInterval(timerId);
        }

        if (z.isPlaying) {
            subPlay();
        }
    }
})();
