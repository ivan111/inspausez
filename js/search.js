(function() {
    "use strict";

    z.initSearchPanel = initSearchPanel;
    z.okSearch = okSearch;
    z.cancelSearch = cancelSearch;


    function initSearchPanel() {
        initSilLv();
        initSilDur();
        initSndDur();
        initBeforeDur();
        initAfterDur();
    }


    function initSilLv() {
        var silLvText = d3.select("#sil-lv-text");

        d3.select("#sil-lv")
            .on("input", function () {
                z.silLv = parseInt(this.value);
                silLvText.text(z.silLv);

                var y = z.viz.F_HEIGHT - (z.silLv * z.viz.F_HEIGHT / 100);

                d3.select("#sil-lv")
                    .attr("y1", y)
                    .attr("y2", y);
            })
            .on("change", function () {
                z.labelsSearch = null;
                z.viz.updateLabels();
            });
    }


    function initSilDur() {
        var silDurText = d3.select("#sil-dur-text");

        d3.select("#sil-dur")
            .on("input", function () {
                z.silDurS = parseInt(this.value) / 100;
                silDurText.text(z.silDurS.toFixed(2));
            })
            .on("change", function () {
                z.labelsSearch = null;
                z.viz.updateLabels();
            });
    }


    function initSndDur() {
        var sndDurText = d3.select("#snd-dur-text");

        d3.select("#snd-dur")
            .on("input", function () {
                z.sndDurS = parseInt(this.value) / 100;
                sndDurText.text(z.sndDurS.toFixed(2));
            })
            .on("change", function () {
                z.labelsSearch = null;
                z.viz.updateLabels();
            });
    }


    function initBeforeDur() {
        var beforeDurText = d3.select("#before-dur-text");

        d3.select("#before-dur")
            .on("input", function () {
                z.beforeDurS = parseInt(this.value) / 100;
                beforeDurText.text(z.beforeDurS.toFixed(2));
            })
            .on("change", function () {
                z.labelsSearch = null;
                z.viz.updateLabels();
            });
    }


    function initAfterDur() {
        var afterDurText = d3.select("#after-dur-text");

        d3.select("#after-dur")
            .on("input", function () {
                z.afterDurS = parseInt(this.value) / 100;
                afterDurText.text(z.afterDurS.toFixed(2));
            })
            .on("change", function () {
                z.labelsSearch = null;
                z.viz.updateLabels();
            });
    }


    function okSearch() {
        z.setDivVisibility("#search-mode-tab", false);
        z.setDivVisibility("#normal-mode-tab", true);

        z.labels = z.labelsSearch;
        z.history.save(z.labels);
        z.labelsSearch = null;
        z.isSearchMode = false;
        z.viz.updateLabels();
        z.toolbar.setEnable();
    }


    function cancelSearch() {
        z.setDivVisibility("#search-mode-tab", false);
        z.setDivVisibility("#normal-mode-tab", true);

        z.labelsSearch = null;
        z.isSearchMode = false;
        z.viz.updateLabels();
    }
})();
