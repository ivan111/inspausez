(function() {
    "use strict";

    z.player = {
        canPlay: canPlay,
        play: play,
        playPause: playPause,
        playLabel: playLabel,
        playIfCut: playIfCut,
        canPause: canPause,
        pause: pause,
        changeVolume: changeVolume,
        onChange: null
    };


    var TYPE_PLAY = 1,
        TYPE_PAUSE = 2,
        TYPE_SET_CUR_S = 3,
        IFCUT_DUR_S = 0.8,
        IFCUT_PAUSE_S = 0.5,
        playTbl = [],
        playTblPos,
        timerId,
        loopPlay = false,
        fromPause = false;


    function createPlayPauseTable() {
        var tbl = [];
        var pos = 0;
        var labels;

        if (z.isSearchMode) {
            labels = z.labelsSearch;
        } else {
            labels = z.labels;
        }

        for (var i = 0; i < labels.length; i++) {
            var label = labels[i];

            if (label.isPause()) {
                tbl.push({ type: TYPE_PLAY, startS: pos, endS: label.endS() });
                pos = label.endS();

                tbl.push({ type: TYPE_PAUSE, durS: z.calcPauseS(label.durS()) });
            }
        }

        if (pos < z.durS) {
            tbl.push({ type: TYPE_PLAY, durS: z.durS - pos });
        }

        return tbl;
    }


    function canPlay() {
        return !z.isPlaying && !z.isAudioPlaying;
    }


    function canPause() {
        return z.isPlaying || z.isAudioPlaying;
    }


    function play(tbl, tblPos) {
        if (!canPlay()) {
            return;
        }

        if (!arguments.length) {
            playTbl = [{ type: TYPE_PLAY, startS: 0, endS: z.durS }];
            playTblPos = 0;

            loopPlay = true;
        } else {
            playTbl = tbl;
            playTblPos = tblPos;
        }

        subPlay(true);
    }


    function playPause() {
        if (!canPlay()) {
            return;
        }

        var tbl = createPlayPauseTable();
        var tblPos = searchCurTblPos(tbl);

        loopPlay = true;

        play(tbl, tblPos);
    }


    function playLabel(label) {
        if (!canPlay()) {
            return;
        }

        var tbl = [{ type: TYPE_PLAY, startS: label.startS(), endS: label.endS() }];
        z.curS = label.startS();

        loopPlay = false;

        play(tbl, 0);

        z.toolbar.setEnable();
    }


    function playIfCut() {
        if (!canPlay()) {
            return;
        }

        var tbl = [];
        tbl.push({ type: TYPE_PLAY, startS: Math.max(0, z.curS - IFCUT_DUR_S), endS: z.curS });
        tbl.push({ type: TYPE_PAUSE, durS: IFCUT_PAUSE_S });
        tbl.push({ type: TYPE_PLAY, startS: z.curS, endS: Math.min(z.curS + IFCUT_DUR_S, z.durS) });
        tbl.push({ type: TYPE_SET_CUR_S, curS: z.curS });

        z.curS = tbl[0].startS;

        loopPlay = false;

        play(tbl, 0);

        z.toolbar.setEnable();
    }


    function searchCurTblPos(tbl) {
        for (var i = 0; i < tbl.length; i++) {
            var d = tbl[i];

            if (d.type === TYPE_PLAY && d.startS <= z.curS && z.curS < d.endS) {
                return i;
            }
        }

        return 0;
    }


    function subPlay(isFirst) {
        z.isPlaying = true;

        var d = playTbl[playTblPos];

        if (d.type === TYPE_PLAY) {
            var startS = d.startS;
            var durS = d.endS - d.startS;

            if (isFirst && d.type === TYPE_PLAY && z.curS !== d.startS) {
                startS = z.curS;
                durS -= z.curS - d.startS;
            }

            z.offsetTime = startS;

            playAudio(startS, durS);
        } else if (d.type === TYPE_PAUSE) {
            playSilence(d.durS);
        } else {
            z.isPlaying = false;
            z.curS = d.curS;
            z.player.onChange();
            z.toolbar.setEnable();
        }
    }


    function playAudio(startS, durS) {
        z.source = z.context.createBufferSource();
        z.source.buffer = z.buffer;
        z.source.onended = onEnded;

        z.gainNode = z.context.createGain();
        z.gainNode.gain.value = z.curGain;

        z.source.connect(z.gainNode);
        z.gainNode.connect(z.context.destination);

        z.source.start(0, startS, durS);

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


    function playSilence(durS) {
        setTimeout(onEnded, Math.floor(durS * 1000));
    }


    function pause() {
        z.isPlaying = false;
        fromPause = true;

        if (z.isAudioPlaying) {
            z.source.stop();
            z.curS = z.offsetTime + z.context.currentTime - z.startTime;
            z.player.onChange();
        }

        z.toolbar.setEnable();
    }


    function onEnded() {
        if (z.isAudioPlaying) {
            z.isAudioPlaying = false;
            clearInterval(timerId);
        }

        z.gainNode = null;

        if (fromPause) {
            fromPause = false;
        } else {
            var d = playTbl[playTblPos];

            if (d && d.type === TYPE_PLAY) {
                z.curS = d.endS;
                z.player.onChange();
            }
        }

        if (!z.isPlaying) {
            z.toolbar.setEnable();
            return;
        }

        playTblPos++;

        if (playTblPos < playTbl.length) {
            subPlay();
            return;
        }

        if (loopPlay) {
            playTblPos = 0;
            z.curS = 0;

            subPlay();
        } else {
            z.isPlaying = false;
            z.toolbar.setEnable();
        }
    }
})();
