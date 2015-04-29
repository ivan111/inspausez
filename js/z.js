(function() {
    "use strict";

    window.z = {
        WIDTH: 960,
        HEIGHT: 500,
        INSERT_DUR_S: 0.5,
        MIN_DUR_S: 0.1,

        run: run,
        head: head,
        canHead: canHead,
        onLoadAudio: onload,
        calcPauseS: calcPauseS,
        canUndo: canUndo,
        undo: undo,
        canRedo: canRedo,
        redo: redo,
        setLabels: setLabels,
        setDivVisibility: setDivVisibility,

        context: null,
        source: null,
        isPlaying: false,
        isAudioPlaying: false,
        startTime: 0,
        offsetTime: 0,
        buffer: null,
        timerId: null,

        vol: null,
        len: 0,
        durS: 0,
        curS: 0,
        factor: 1,
        addS: 0.2,
        curGain: 1,
        labels: null,
        history: null,
        labelsSearch: null,
        isSearchMode: false,
        curLabelI: 0,

        SIL_LV: 5,
        SIL_DUR_S: 0.3,
        SND_DUR_S: 0.2,
        BEFORE_DUR_S: 0.2,
        AFTER_DUR_S: 0.2
    };


    z.silLv = z.SIL_LV;
    z.silDurS = z.SIL_DUR_S;
    z.sndDurS = z.SND_DUR_S;
    z.beforeDurS = z.BEFORE_DUR_S;
    z.afterDurS = z.AFTER_DUR_S;


    function run() {
        z.context = z.audio.getContext();

        if (!z.context) {
            window.alert("サポートされていないブラウザです。PC版のChrome か Firefox で試してみてください。");
            return;
        }

        init();

        z.audio.load(z.context, "jfk.mp3", onload);
    }


    function init() {
        z.labels = z.createLabels();
        z.history = z.createHistory(z.labels);

        d3.select("#normal-mode-tab").style("pointer-events", "none");

        d3.select("#download-audio-link").on("click", function () {
            var blob = z.createWavBlob();
            var url = (window.URL || window.webkitURL).createObjectURL(blob);
            this.href = url;
        });

        d3.select("#download-info-link").on("click", function () {
            var blob = new window.Blob([z.labels.toString()], { type: "text/plain" });
            var url = (window.URL || window.webkitURL).createObjectURL(blob);
            this.href = url;
        });

        d3.select("#search-mode-button").on("click", function () {
            setDivVisibility("#search-mode-tab", true);
            setDivVisibility("#normal-mode-tab", false);
            z.labelsSearch = null;
            z.isSearchMode = true;
            z.viz.updateLabels();
        });

        initFactorRange();
        initAddSRange();

        z.file.init();
        z.viz.init();
        z.initSearchPanel();
        z.toolbar.init();

        z.player.onChange = changeCurrentTime;

        setVolumeHandler();
        setKeyDownHandler();

        z.toolbar.setEnable();
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
        z.viz.setVolume();

        d3.select("#current-pos").style("visibility", "visible");
        d3.select("#normal-mode-tab").style("pointer-events", "auto");

        setLabels(z.findSound(z.vol));
    }


    function setLabels(labels) {
        z.labels = labels;
        z.history = z.createHistory(labels);
        z.labelsSearch = null;
        z.viz.updateLabels();
        z.toolbar.setEnable();
    }


    function head() {
        if (z.isPlaying) {
            z.player.pause();
        }

        z.curS = 0;
        z.offsetTime = 0;
        z.viz.updateCurrentPos(true);

        z.toolbar.setEnable();
    }


    function canHead() {
        return z.curS !== 0 && !z.isPlaying && !z.isAudioPlaying;
    }


    function changeCurrentTime() {
        if (z.isAudioPlaying) {
            z.curS = z.offsetTime + z.context.currentTime - z.startTime;
        }

        z.viz.updateCurrentPos(true);
    }


    function calcPauseS(durS) {
        return durS * z.factor + z.addS;
    }


    function canUndo() {
        if (!z.isSearchMode && z.history && z.history.canUndo()) {
            return true;
        }

        return false;
   }


    function undo() {
        if (z.history && z.history.canUndo()) {
            z.labels = z.history.undo();
            z.viz.updateLabels();
        }
    }


    function canRedo() {
        if (!z.isSearchMode && z.history && z.history.canRedo()) {
            return true;
        }

        return false;
    }


    function redo() {
        if (z.history && z.history.canRedo()) {
            z.labels = z.history.redo();
            z.viz.updateLabels();
        }
    }


    function initFactorRange() {
        var factorText = d3.select("#factor-text");

        d3.select("#factor")
            .on("input", function () {
                z.factor = parseInt(this.value) / 100;
                factorText.text(z.factor.toFixed(2));
            })
            .on("change", function () {
                z.factor = parseInt(this.value) / 100;
                factorText.text(z.factor.toFixed(2));
            });
    }


    function initAddSRange() {
        var addSText = d3.select("#add-text");

        d3.select("#add")
            .on("input", function () {
                z.addS = parseInt(this.value) / 100;
                addSText.text(z.addS.toFixed(1));
            })
            .on("change", function () {
                z.addS = parseInt(this.value) / 100;
                addSText.text(z.addS.toFixed(1));
            });
    }


    function setDivVisibility(idName, visibility) {
        var item = d3.select(idName);

        if (visibility) {
            item.style("display", "block");
        } else {
            item.style("display", "none");
        }
    }
})();
