(function() {
    "use strict";

    window.z = {
        WIDTH: 960,
        HEIGHT: 500,

        run: run,
        head: head,
        canHead: canHead,
        onLoadAudio: onload,

        context: null,
        source: null,
        isPlaying: false,
        isAudioPlaying: false,
        startTime: 0,
        offsetTime: 0,
        buffer: null,
        timerId: null,

        vol: [0],
        len: 1,
        durS: 0,
        curS: 0,
        curGain: 1,
        labels: [],
        curLabelI: 0
    };


    function run() {
        z.context = z.audio.getContext();

        if (!z.context) {
            window.alert("Your browser is not supported");
            return;
        }

        z.file.init();
        z.viz.init();
        z.toolbar.init();

        z.player.onChange = changeCurrentTime;

        setVolumeHandler();
        setKeyDownHandler();

        z.toolbar.setEnable();

        z.audio.load(z.context, "jfk.mp3", onload);
    }


    function setVolumeHandler() {
        d3.select("#volume")
            .on("input", function () {
                z.player.changeVolume(this);
            })
            .on("change", function () {
                z.player.changeVolume(this);
            });
    }


    function setKeyDownHandler() {
        d3.select("body")
            .on("keydown", function () {
                var n = d3.event.keyCode;

                if (n === 107) {  // add
                    z.viz.zoomIn();
                } else if (n === 109) {  // subtract
                    z.viz.zoomOut();
                }
            });
    }


    function onload(buffer) {
        z.buffer = buffer;

        z.vol = z.calcVolume(buffer);
        z.len = z.vol.length;
        z.durS = buffer.duration;
        z.curS = 0;
        z.offsetTime = 0;
        z.viz.setCurrentPos(0);
        z.viz.setVolume();

        z.labels = z.findSound(z.vol);
        z.viz.setLabels();
    }


    function head() {
        if (z.isPlaying) {
            z.player.pause();
        }

        z.curS = 0;
        z.offsetTime = 0;
        z.viz.setCurrentPos(0);

        z.toolbar.setEnable();
    }


    function canHead() {
        return z.curS !== 0 && !z.isPlaying && !z.isAudioPlaying;
    }


    function changeCurrentTime() {
        if (z.isAudioPlaying) {
            z.curS = z.offsetTime + z.context.currentTime - z.startTime;
        }

        z.viz.setCurrentPos(z.curS);
    }
})();
