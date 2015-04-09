(function() {
    "use strict";

    window.z.toolbar = {
        init: init,
        setEnable: setEnable
    };


    var toolTbl = [
            { id: "#tool-head", isEnable: z.canHead, onClick: z.head },
            { id: "#tool-play", isEnable: z.player.canPlay, onClick: z.player.play },
            { id: "#tool-playpause", isEnable: z.player.canPlay, onClick: z.player.playPause },
            { id: "#tool-pause", isEnable: z.player.canPause, onClick: z.player.pause },
            { id: "#tool-zoomin", isEnable: z.viz.canZoomIn, onClick: z.viz.zoomIn },
            { id: "#tool-zoomout", isEnable: z.viz.canZoomOut, onClick: z.viz.zoomOut }
        ];


    function init() {
        for (var i = 0; i < toolTbl.length; i++) {
            var d = toolTbl[i];
            d.item = d3.select(d.id);

            if (d.onClick) {
                d.item.on("click", (function (data) {
                    return function () {
                        if (data.item.classed("enabled")) {
                            data.onClick();
                            z.toolbar.setEnable();
                        }
                    };
                })(d));
            }
        }
    }


    function setEnable() {
        for (var i = 0; i < toolTbl.length; i++) {
            var d = toolTbl[i];

            if (d.isEnable && d.isEnable()) {
                d.item.classed("enabled", true);
            } else {
                d.item.classed("enabled", false);
            }
        }
    }
})();
