(function() {
    "use strict";

    window.z.viz = {
        init: init,
        setVolume: setVolume,
        setLabels: setLabels,
        setCurrentPos: setCurrentPos,
        canZoomIn: canZoomIn,
        zoomIn: zoomIn,
        canZoomOut: canZoomOut,
        zoomOut: zoomOut
    };


    var WIDTH = 960,
        HEIGHT = 500,

        F_MARGIN = { top: 10, right: 10, bottom: 100, left: 10 },
        C_MARGIN = { top: 430, right: 10, bottom: 20, left: 10 },

        F_WIDTH = WIDTH - F_MARGIN.left - F_MARGIN.right,
        F_HEIGHT = HEIGHT - F_MARGIN.top - F_MARGIN.bottom,
        C_HEIGHT = HEIGHT - C_MARGIN.top - C_MARGIN.bottom,

        viewport = {
            startS: 0,
            scale: 4,
            endS: function () {
                var s = (F_WIDTH * this.scale) / z.VOL_RATE;

                return Math.min(this.startS + s, z.durS);
            },
            durS: function () {
                return this.endS() - this.startS;
            }
        },

        focusVolume, focusAxis, contextVolume, contextAxis, brush, labelsLayer,
        labelsRects, currentPos;


    function init() {
        d3.select("#focus-layer")
            .attr("transform", ["translate(", F_MARGIN.left, ",", F_MARGIN.top, ")"].join(""));

        focusVolume = d3.select("#focus-volume");

        focusAxis = d3.select("#focus-axis")
            .attr("transform", ["translate(0,", F_HEIGHT, ")"].join(""));

        d3.select("#context-layer")
            .attr("transform", ["translate(", C_MARGIN.left, ",", C_MARGIN.top, ")"].join(""));

        contextVolume = d3.select("#context-volume");

        contextAxis = d3.select("#context-axis")
            .attr("transform", ["translate(0,", C_HEIGHT, ")"].join(""));

        d3.select("#focus-rect")
            .attr("width", F_WIDTH)
            .attr("height", F_HEIGHT)
            .on("click", clickHandlerFocus);

        d3.select("#context-rect")
            .attr("width", F_WIDTH)
            .attr("height", C_HEIGHT)
            .on("click", clickHandlerContext);

        brush = d3.select("#brush");

        labelsLayer = d3.select("#labels-layer");

        currentPos = d3.select("#current-pos");
    }


    function setVolume() {
        updateContextLayer();
        updateFocusLayer();
    }


    function setLabels() {
        labelsLayer.selectAll("rect").remove();

        labelsRects = labelsLayer.selectAll("rect")
            .data(z.labels);

        labelsRects
            .enter()
            .append("rect")
            .attr("class", "label")
            .attr("x", function (d) { return d.startS * z.VOL_RATE; })
            .attr("y", 0)
            .attr("width", function (d) { return d.getDurS() * z.VOL_RATE; })
            .attr("height", F_HEIGHT)
            .style("fill", label2rgb);

        transformLabels();
    }


    function setCurrentPos(s) {
        var x = (s * z.VOL_RATE) / viewport.scale;

        currentPos
            .attr("x1", x)
            .attr("x2", x);

        if (s < viewport.startS || s > viewport.endS()) {
            setStartS(s);
        }
    }


    function label2rgb(d) {
        var c = d.getColour();

        return ["rgb(", c[0], ",", c[1], ",", c[2], ")"].join("");
    }


    function updateFocusLayer() {
        var y = d3.scale.linear()
            .range([F_HEIGHT, 0])
            .domain([0, Math.max.apply(null, z.vol)]);

        var area = d3.svg.area()
            .x(function (d, k) { return k; })
            .y0(F_HEIGHT)
            .y1(function (d) { return y(d); });

        var endS = viewport.endS();

        var vol2 = z.getSubVolume(viewport.startS, endS, viewport.scale);

        focusVolume
            .datum(vol2)
            .attr("d", area);

        var s = (F_WIDTH * viewport.scale) / z.VOL_RATE;

        var x = d3.scale.linear()
            .range([0, F_WIDTH])
            .domain([viewport.startS, viewport.startS + s]);

        var axis = d3.svg.axis().scale(x).orient("bottom");

        focusAxis.call(axis);
    }


    function updateContextLayer() {
        var x = d3.scale.linear()
            .range([0, F_WIDTH])
            .domain([0, z.len]);

        var y = d3.scale.linear()
            .range([C_HEIGHT, 0])
            .domain([0, Math.max.apply(null, z.vol)]);

        var area = d3.svg.area()
            .x(function (d, k) { return k; })
            .y0(C_HEIGHT)
            .y1(function (d) { return y(d); });

        var vol2 = [];

        for (var i = 0; i < F_WIDTH; i++) {
            vol2.push(z.vol[Math.floor(x.invert(i))]);
        }

        contextVolume
            .datum(vol2)
            .attr("d", area);

        var x2 = d3.scale.linear()
            .range([0, F_WIDTH])
            .domain([0, z.durS]);

        var axis = d3.svg.axis().scale(x2).orient("bottom");

        contextAxis.call(axis);

        updateBrush();
        brush.style("visibility", "visible");
    }


    function setStartS(s) {
        var widthS = (F_WIDTH * viewport.scale) / z.VOL_RATE;
        var maxStartS = z.durS - widthS;

        var startS = Math.max(0, Math.min(s, maxStartS));

        if (startS !== viewport.startS) {
            viewport.startS = startS;

            updateFocusLayer();
            updateBrush();
            transformLabels();
            transformCurrentPos();
        }
    }


    function updateBrush() {
        var x = sec2xC(viewport.startS);
        var w = sec2xC(viewport.durS());

        if (w === 0) {
            w = 1;
        }

        brush
            .attr("x", x)
            .attr("width", w);
    }


    function clickHandlerFocus() {
        if (z.isPlaying || z.isAudioPlaying) {
            return;
        }

        var s = viewport.startS;
        s += d3.mouse(this)[0] * viewport.scale / z.VOL_RATE;

        z.curS = s;
        setCurrentPos(s);
        z.toolbar.setEnable();
    }


    function clickHandlerContext() {
        var s = xC2sec(d3.mouse(this)[0]);
        var halfS = (F_WIDTH * viewport.scale / 2) / z.VOL_RATE;
        s -= halfS;

        setStartS(s);
    }


    function canZoomIn() {
        return viewport.scale !== 1;
    }


    function zoomIn() {
        if (!canZoomIn()) {
            return;
        }

        viewport.scale /= 2;

        updateFocusLayer();
        updateBrush();
        transformLabels();
        transformCurrentPos();

        if (z.isPlaying) {
            setCurrentPos(z.curS);
        }
    }


    function canZoomOut() {
        return viewport.scale <= 8;
    }


    function zoomOut() {
        if (!canZoomOut()) {
            return;
        }

        viewport.scale *= 2;

        updateFocusLayer();
        updateBrush();
        transformLabels();
        transformCurrentPos();

        if (z.isPlaying) {
            setCurrentPos(z.curS);
        }
    }


    function transformLabels() {
        var x = -viewport.startS * z.VOL_RATE / viewport.scale;

        labelsLayer.attr("transform", ["translate(", x, ",0) scale(", 1 / viewport.scale, ",1)"].join(""));
    }


    function transformCurrentPos() {
        var x = -viewport.startS * z.VOL_RATE / viewport.scale;

        currentPos.attr("transform", ["translate(", x, ",0)"].join(""));
    }


    function sec2xC(s) {
        return s * F_WIDTH / z.durS;
    }


    function xC2sec(x) {
        return x * z.durS / F_WIDTH;
    }
})();
