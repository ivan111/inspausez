(function() {
    "use strict";

    z.viz = {
        init: init,
        setVolume: setVolume,
        updateLabels: updateLabels,
        updateCurrentPos: updateCurrentPos,
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

        HANDLE_DUR = 500,
        H_UNIT = Math.floor(F_HEIGHT / 6),

        vp = z.viewport(F_WIDTH, z.VOL_RATE, onChangeViewport),
        isDragging = false,

        $d3;

    z.viz.F_HEIGHT = F_HEIGHT;


    var dragScroll = d3.behavior.drag()
        .on("dragstart", function () {
            isDragging = true;
        })
        .on("dragend", function () {
            isDragging = false;
        })
        .on("drag", function() {
            vp.startS(vp.startS() - vp.width2sec(d3.event.dx));
        });


    function init() {
        $d3 = {};

        initViz();
    }


    function initViz() {
        d3.select("#viz").on("mousewheel", onMouseWheel);
        d3.select("#viz").on("DOMMouseScroll", onMouseWheel);

        d3.select("#focus-layer")
            .attr("transform", tranStr(F_MARGIN.left, F_MARGIN.top));

        $d3.focusVolume = d3.select("#focus-volume");

        $d3.focusAxis = d3.select("#focus-axis")
            .attr("transform", tranStr(0, F_HEIGHT));

        d3.select("#context-layer")
            .attr("transform", tranStr(C_MARGIN.left, C_MARGIN.top));

        $d3.contextVolume = d3.select("#context-volume");

        $d3.contextAxis = d3.select("#context-axis")
            .attr("transform", tranStr(0, C_HEIGHT));

        d3.select("#focus-rect")
            .call(dragScroll)
            .attr("width", F_WIDTH)
            .attr("height", F_HEIGHT)
            .on("click", clickHandlerFocus);

        d3.select("#context-rect")
            .attr("width", F_WIDTH)
            .attr("height", C_HEIGHT)
            .on("click", clickHandlerContext);

        $d3.labelsLayer = d3.select("#labels-layer");
        $d3.activeLabelLayer = d3.select("#active-label-layer");

        initInsertHandle();
        initLeftHandle();
        initRightHandle();
        initCutHandle();
        initPlay1Handle();
        initPlay2Handle();
        initPlay3Handle();
        initRemoveHandle();
        initLeftMergeHandle();
        initRightMergeHandle();

        $d3.pauseRect = d3.select("#pause-rect");
        $d3.currentPos = d3.select("#current-pos");
        $d3.brush = d3.select("#brush");
    }


    function initInsertHandle() {
        $d3.insertHandleLayer = d3.select("#insert-handle-layer");

        $d3.insertHandle = d3.select("#insert-handle")
            .on("click", function () {
                if (z.isSearchMode || z.isPlaying) {
                    return;
                }

                z.labels.insertLabel(z.curS, z.INSERT_DUR_S, z.durS);
                z.history.save(z.labels);
                $d3.insertHandleLayer.style("visibility", "hidden");
                updateLabels();
                z.toolbar.setEnable();
            })
            .on("mouseover", setHoverStyle)
            .on("mouseout", removeHoverStyle);

        $d3.insertIcon = d3.select("#insert-icon");
    }


    function initLeftHandle() {
        $d3.leftHandleLayer = d3.select("#left-handle-layer")
            .on("mouseout", mouseoutLabelHandler);

        $d3.leftHandle = d3.select("#left-handle")
            .on("mouseover", setHoverStyle)
            .on("mouseout", removeHoverStyle);

        $d3.leftHandleTriangle = d3.select("#left-handle-triangle");
    }


    function initRightHandle() {
        $d3.rightHandleLayer = d3.select("#right-handle-layer")
            .on("mouseout", mouseoutLabelHandler);

        $d3.rightHandle = d3.select("#right-handle")
            .on("mouseover", setHoverStyle)
            .on("mouseout", removeHoverStyle);

        $d3.rightHandleTriangle = d3.select("#right-handle-triangle");
    }


    function initCutHandle() {
        $d3.cutHandleLayer = d3.select("#cut-handle-layer")
            .on("mouseout", mouseoutLabelHandler);

        $d3.cutHandle = d3.select("#cut-handle")
            .on("click", function () {
                if (z.isSearchMode || z.isPlaying) {
                    return;
                }

                z.labels.cut(z.curS);
                z.history.save(z.labels);
                updateLabels();
                z.toolbar.setEnable();
            })
            .on("mouseover", setHoverStyle)
            .on("mouseout", removeHoverStyle);

        $d3.cutIcon = d3.select("#cut-icon");
    }


    function initPlay1Handle() {
        $d3.play1HandleLayer = d3.select("#play1-handle-layer")
            .on("mouseout", mouseoutLabelHandler);

        $d3.play1Handle = d3.select("#play1-handle")
            .on("click", function (d) {
                z.player.playLabel(d);
                updateLabels();
            })
            .on("mouseover", setHoverStyle)
            .on("mouseout", removeHoverStyle);

        $d3.play1Icon = d3.select("#play1-icon");
    }


    function initPlay2Handle() {
        $d3.play2HandleLayer = d3.select("#play2-handle-layer")
            .on("mouseout", mouseoutLabelHandler);

        $d3.play2Handle = d3.select("#play2-handle")
            .on("click", function () {
                z.player.playIfCut();
                updateLabels();
            })
            .on("mouseover", setHoverStyle)
            .on("mouseout", removeHoverStyle);

        $d3.play2Icon = d3.select("#play2-icon");
    }


    function initPlay3Handle() {
        $d3.play3HandleLayer = d3.select("#play3-handle-layer")
            .on("mouseout", mouseoutLabelHandler);

        $d3.play3Handle = d3.select("#play3-handle")
            .on("click", function (d) {
                z.curS = d.endS();
                z.player.playIfCut();
                updateLabels();
            })
            .on("mouseover", setHoverStyle)
            .on("mouseout", removeHoverStyle);

        $d3.play3Icon = d3.select("#play3-icon");
    }


    function initRemoveHandle() {
        $d3.removeHandleLayer = d3.select("#remove-handle-layer")
            .on("mouseout", mouseoutLabelHandler);

        $d3.removeHandle = d3.select("#remove-handle")
            .on("click", function (d) {
                if (z.isSearchMode || z.isPlaying) {
                    return;
                }

                z.labels.remove(d);
                z.history.save(z.labels);
                updateLabels();
                hideActiveLabel();
                z.toolbar.setEnable();
            })
            .on("mouseover", setHoverStyle)
            .on("mouseout", removeHoverStyle);

        $d3.removeIcon = d3.select("#remove-icon");
    }


    function initLeftMergeHandle() {
        $d3.lmergeHandleLayer = d3.select("#lmerge-handle-layer")
            .on("mouseout", mouseoutLabelHandler);

        $d3.lmergeHandle = d3.select("#lmerge-handle")
            .on("click", function (d) {
                if (z.isSearchMode || z.isPlaying) {
                    return;
                }

                z.labels.leftMerge(d);
                z.history.save(z.labels);
                updateLabels();
                hideActiveLabel();
                z.toolbar.setEnable();
            })
            .on("mouseover", setHoverStyle)
            .on("mouseout", removeHoverStyle);

        $d3.lmergeIcon = d3.select("#lmerge-icon");
    }


    function initRightMergeHandle() {
        $d3.rmergeHandleLayer = d3.select("#rmerge-handle-layer")
            .on("mouseout", mouseoutLabelHandler);

        $d3.rmergeHandle = d3.select("#rmerge-handle")
            .on("click", function (d) {
                if (z.isSearchMode || z.isPlaying) {
                    return;
                }

                z.labels.rightMerge(d);
                z.history.save(z.labels);
                updateLabels();
                hideActiveLabel();
                z.toolbar.setEnable();
            })
            .on("mouseover", setHoverStyle)
            .on("mouseout", removeHoverStyle);

        $d3.rmergeIcon = d3.select("#rmerge-icon");
    }


    function setVolume() {
        vp.maxEndS(z.durS);

        updateFocusVolume();
        updateContextLayer();
    }


    function onChangeViewport() {
        updateFocusVolume();
        updateLabels();
        updateCurrentPos();
        updateBrush();

        if ($d3.activeLabel) {
            hideActiveLabel();
        }
    }


    function updateFocusVolume() {
        var y = d3.scale.linear()
            .range([F_HEIGHT, 0])
            .domain([0, Math.max.apply(null, z.vol)]);

        var area = d3.svg.area()
            .x(function (d, k) { return k; })
            .y0(F_HEIGHT)
            .y1(function (d) { return y(d); });

        var vol2 = z.getSubVolume(vp.startS(), vp.scale(), F_WIDTH);

        $d3.focusVolume
            .datum(vol2)
            .attr("d", area);

        var x = d3.scale.linear()
            .range([0, F_WIDTH])
            .domain(vp.range());

        var axis = d3.svg.axis().scale(x).orient("bottom");

        $d3.focusAxis.call(axis);
    }


    function updateLabels() {
        var labels;

        $d3.labelsLayer.html("");

        if (z.isSearchMode) {
            if (!z.labelsSearch) {
                z.labelsSearch = z.findSound(z.vol, z.silLv, z.silDurS, z.sndDurS, z.beforeDurS, z.afterDurS);
            }

            labels = getVisibleLabels(z.labelsSearch);

            $d3.labelsRects = $d3.labelsLayer.selectAll("rect")
                .data(labels);

            var g = $d3.labelsRects
                .enter()
                .append("g")
                .call(dragScroll)
                .on("click", clickHandlerFocus);

            var w = vp.sec2width(z.beforeDurS);
            var h = Math.floor(F_HEIGHT / 3);

            g
                .append("rect")
                .attr("class", "before-label")
                .attr("x", function (d) { return vp.sec2x(d.startS()); })
                .attr("y", 0)
                .attr("width", w)
                .attr("height", h);

            w = vp.sec2width(z.afterDurS);

            g
                .append("rect")
                .attr("class", "after-label")
                .attr("x", function (d) { return vp.sec2x(d.startS()) + vp.sec2width(d.durS()) - w; })
                .attr("y", Math.floor(F_HEIGHT * 2 / 3))
                .attr("width", w)
                .attr("height", h);

            g
                .append("rect")
                .attr("class", "search-label")
                .attr("x", function (d) { return vp.sec2x(d.startS()); })
                .attr("y", 0)
                .attr("width", function (d) { return vp.sec2width(d.durS()); })
                .attr("height", F_HEIGHT)
                .style("fill", label2rgb);

            var y = F_HEIGHT - (z.silLv * F_HEIGHT / 100);

            $d3.labelsLayer.append("line")
                .attr("id", "sil-lv")
                .attr("class", "sil-lv")
                .attr("x1", 0)
                .attr("y1", y)
                .attr("x2", F_WIDTH)
                .attr("y2", y);
        } else {
            labels = getVisibleLabels(z.labels);

            $d3.labelsRects = $d3.labelsLayer.selectAll("rect")
                .data(labels);

            $d3.labelsRects
                .enter()
                .append("rect")
                .call(dragScroll)
                .attr("class", "label")
                .attr("x", function (d) { return vp.sec2x(d.startS()); })
                .attr("y", 0)
                .attr("width", function (d) { return vp.sec2width(d.durS()); })
                .attr("height", F_HEIGHT)
                .on("click", clickHandlerFocus)
                .on("mouseover", mouseoverLabelHandler)
                .on("mouseout", mouseoutLabelHandler)
                .style("fill", label2rgb);
        }
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

        $d3.contextVolume
            .datum(vol2)
            .attr("d", area);

        var x2 = d3.scale.linear()
            .range([0, F_WIDTH])
            .domain([0, z.durS]);

        var axis = d3.svg.axis().scale(x2).orient("bottom");

        $d3.contextAxis.call(axis);

        updateBrush();
        $d3.brush.style("visibility", "visible");
    }


    function updateCurrentPos(isAutoScroll) {
        var x = vp.sec2x(z.curS);

        $d3.currentPos
            .attr("x1", x)
            .attr("x2", x);

        if (isAutoScroll && !vp.isVisible(z.curS)) {
            vp.startS(z.curS);
        }

        showInsertHandle();
    }


    function updateBrush() {
        var x = vp.sec2ax(vp.startS());
        var w = vp.sec2ax(vp.durS());

        if (w === 0) {
            w = 1;
        }

        $d3.brush
            .attr("x", x)
            .attr("width", w);
    }


    function clickHandlerFocus() {
        if (z.isPlaying || z.isAudioPlaying) {
            return;
        }

        var x = d3.mouse(this)[0];
        var s = vp.x2sec(x);

        z.curS = s;
        updateCurrentPos();
        z.toolbar.setEnable();

        if ($d3.activeLabel) {
            showCutAndPlay2Handle();
        }
    }


    function clickHandlerContext() {
        var x = d3.mouse(this)[0];
        var halfS = vp.width2sec(F_WIDTH / 2);
        var s = vp.ax2sec(x) - halfS;

        vp.startS(s);
    }

    var leftDrag = d3.behavior.drag()
        .on("dragstart", function () {
            isDragging = true;
        })
        .on("dragend", function (d) {
            isDragging = false;
            z.history.save(z.labels);
            z.toolbar.setEnable();

            if ($d3.activeLabel && !isInLabel(d, d3.mouse(this))) {
                hideActiveLabel();
            }
        })
        .on("drag", function (d) {
            var newW = d.dragInfo.w - d3.event.dx;
            var newDurS = vp.width2sec(newW);

            if (newDurS <= z.MIN_DUR_S) {
                return;
            }

            d.dragInfo.leftX += d3.event.dx;
            d.dragInfo.x += d3.event.dx;
            d.dragInfo.w -= d3.event.dx;

            var leftX = d.dragInfo.leftX;
            var x = d.dragInfo.x;
            var w = d.dragInfo.w;

            $d3.leftHandle.attr("transform", tranStr(leftX, 0));
            $d3.leftHandleTriangle.attr("transform", tranStr(leftX, 0));
            $d3.lmergeHandle.attr("transform", tranStr(leftX + 65, 0));
            $d3.lmergeIcon.attr("transform", tranStr(leftX, 0));
            $d3.removeHandle.attr("transform", tranStr(x + (w / 2) - 50, 0));
            $d3.removeIcon.attr("transform", tranStr(x + (w / 2), 0));
            $d3.play1Handle.attr("transform", tranStr(leftX, 0));
            $d3.play1Icon.attr("transform", tranStr(leftX, 0));

            d.startS(vp.x2sec(x));

            $d3.activeLabel
                .attr("x", x)
                .attr("width", w)
                .style("fill", label2rgb);

            var pauseS = z.calcPauseS(d.durS());
            d.dragInfo.pauseW = vp.sec2width(pauseS);

            $d3.pauseRect
                .attr("width", d.dragInfo.pauseW);
        });

    var rightDrag = d3.behavior.drag()
        .on("dragstart", function () {
            isDragging = true;
        })
        .on("dragend", function (d) {
            isDragging = false;
            z.history.save(z.labels);
            z.toolbar.setEnable();

            if ($d3.activeLabel && !isInLabel(d, d3.mouse(this))) {
                hideActiveLabel();
            }
        })
        .on("drag", function(d) {
            var newW = d.dragInfo.w + d3.event.dx;
            var newDurS = vp.width2sec(newW);

            if (newDurS <= z.MIN_DUR_S) {
                return;
            }

            var newX = d.dragInfo.rightX + d3.event.dx;

            if (newX <= d.dragInfo.rightMinX || newX >= d.dragInfo.rightMaxX) {
                return;
            }

            d.dragInfo.rightX += d3.event.dx;
            d.dragInfo.w += d3.event.dx;

            var rightX = d.dragInfo.rightX;
            var x = d.dragInfo.x;
            var w = d.dragInfo.w;

            $d3.rightHandle.attr("transform", tranStr(rightX, 0));
            $d3.rightHandleTriangle.attr("transform", tranStr(rightX, 0));
            $d3.play3Handle.attr("transform", tranStr(rightX - 65, 0));
            $d3.play3Icon.attr("transform", tranStr(rightX - 65, 0));
            $d3.rmergeHandle.attr("transform", tranStr(rightX - 65, 0));
            $d3.rmergeIcon.attr("transform", tranStr(rightX - 65, 0));
            $d3.removeHandle.attr("transform", tranStr(x + (w / 2) - 50, 0));
            $d3.removeIcon.attr("transform", tranStr(x + (w / 2), 0));

            d.endS(vp.x2sec(x + w));

            $d3.activeLabel
                .attr("width", w)
                .style("fill", label2rgb);

            var pauseS = z.calcPauseS(d.durS());
            d.dragInfo.pauseW = vp.sec2width(pauseS);

            $d3.pauseRect
                .attr("x", x + w)
                .attr("width", d.dragInfo.pauseW);
        });


    function mouseoverLabelHandler(d) {
        if (z.isSearchMode || isDragging || z.isPlaying) {
            return;
        }

        if ($d3.activeLabel && isInLabel(d, d3.mouse(this))) {
            return;
        }

        $d3.activeLabelLayer
            .style("visibility", "visible");

        $d3.activeLabel = d3.select(this)
            .classed("active", true);

        var x = vp.sec2x(d.startS());
        var w = vp.sec2width(d.durS());
        var pauseS = d.durS() * z.factor + z.addS;
        var pauseW = vp.sec2width(pauseS);

        var rightMaxX = F_WIDTH;
        var nextLabel = z.labels.getNext(d);
        if (nextLabel) {
            rightMaxX = vp.sec2x(nextLabel.endS());
        }

        var rightMinX = 0;
        var prevLabel = z.labels.getPrev(d);
        if (prevLabel) {
            rightMinX = vp.sec2x(prevLabel.endS());
        }

        d.dragInfo = {
            x: x,
            w: w,
            pauseW: pauseW,
            leftX: x,
            rightX: x + w,
            rightMinX: rightMinX,
            rightMaxX: rightMaxX
        };

        showLeftHandle(x, leftDrag);
        showRightHandle(x + w, rightDrag);

        showRemoveHandle(x + (w / 2));

        if (z.labels.canLeftMerge(d)) {
            showLeftMergeHandle(x);
        }

        if (z.labels.canRightMerge(d)) {
            showRightMergeHandle(x + w);
        }

        if (d.contains(z.curS)) {
            showCutAndPlay2Handle();
        }

        showPlay1Handle(x);
        showPlay3Handle(x + w);

        showPauseRect(x + w, pauseW);
    }


    function showLeftHandle(x, drag) {
        showHandleLayer($d3.leftHandleLayer.call(drag));

        var y = H_UNIT * 2;

        handleTransform($d3.leftHandle, [x, y], [x, 0]);
        handleTransform($d3.leftHandleTriangle, [x, y], [x, 0]);
    }


    function showRightHandle(x, drag) {
        showHandleLayer($d3.rightHandleLayer.call(drag));

        var y = H_UNIT * 4;

        handleTransform($d3.rightHandle, [x, y], [x, 0]);
        handleTransform($d3.rightHandleTriangle, [x, y], [x, 0]);
    }


    function showRemoveHandle(x) {
        showHandleLayer($d3.removeHandleLayer);

        handleTransform($d3.removeHandle, [x, F_HEIGHT], [x - 50, 0]);
        handleTransform($d3.removeIcon, [x, F_HEIGHT], [x, 0]);
    }


    function showLeftMergeHandle(x) {
        showHandleLayer($d3.lmergeHandleLayer);

        handleTransform($d3.lmergeHandle, [x, F_HEIGHT], [x + 65, 0]);
        handleTransform($d3.lmergeIcon, [x, F_HEIGHT], [x, 0]);
    }


    function showRightMergeHandle(x) {
        showHandleLayer($d3.rmergeHandleLayer);

        handleTransform($d3.rmergeHandle, [x, F_HEIGHT], [x - 65, 0]);
        handleTransform($d3.rmergeIcon, [x, F_HEIGHT], [x - 65, 0]);
    }


    function showCutAndPlay2Handle() {
        if (z.isSearchMode || z.isPlaying || !$d3.activeLabel || !z.labels.canCut(z.curS)) {
            $d3.cutHandleLayer.style("visibility", "hidden");
            return;
        }

        showHandleLayer($d3.cutHandleLayer);
        showHandleLayer($d3.play2HandleLayer);

        var x = vp.sec2x(z.curS);

        handleTransform($d3.cutHandle, [x, 0], [x, 0]);
        handleTransform($d3.cutIcon, [x, 0], [x, 0]);

        handleTransform($d3.play2Handle, [x, 0], [x - 65, 0]);
        handleTransform($d3.play2Icon, [x, 0], [x - 65, 0]);
    }


    function showPlay1Handle(x) {
        showHandleLayer($d3.play1HandleLayer);

        handleTransform($d3.play1Handle, [x, 0], [x, 0]);
        handleTransform($d3.play1Icon, [x, 0], [x, 0]);
    }


    function showPlay3Handle(x) {
        showHandleLayer($d3.play3HandleLayer);

        handleTransform($d3.play3Handle, [x, 0], [x - 65, 0]);
        handleTransform($d3.play3Icon, [x, 0], [x - 65, 0]);
    }


    function showInsertHandle() {
        if (z.isSearchMode || z.isPlaying || !z.labels || !z.labels.canInsertLabel(z.curS, z.INSERT_DUR_S, z.durS)) {
            $d3.insertHandleLayer.style("visibility", "hidden");
            return;
        }

        $d3.insertHandleLayer.style("visibility", "visible");

        var x = vp.sec2x(z.curS);

        handleTransform($d3.insertHandle, [x, 0], [x, 0]);
        handleTransform($d3.insertIcon, [x, 0], [x, 0]);
    }


    function showHandleLayer(handleLayer) {
        handleLayer
            .data($d3.activeLabel.data())
            .style("visibility", "visible");
    }


    function handleTransform(item, beforePt, afterPt) {
        var beforeTransform = tranStr(beforePt[0], beforePt[1]) + " scale(0)";
        var afterTransform = tranStr(afterPt[0], afterPt[1]);

        if ($d3.activeLabel) {
            item.data($d3.activeLabel.data());
        }

        item
            .interrupt()
            .attr("transform", beforeTransform)
            .transition()
            .duration(HANDLE_DUR)
            .attr("transform", afterTransform);
    }


    function showPauseRect(x, w) {
        $d3.pauseRect
            .interrupt()
            .attr("x", x)
            .attr("width", 0)
            .transition()
            .duration(HANDLE_DUR)
            .attr("width", w);
    }


    function setHoverStyle() {
        d3.select(this).classed("hover", true);
    }


    function removeHoverStyle() {
        d3.select(this).classed("hover", false);
    }


    function mouseoutLabelHandler(d) {
        if (isDragging) {
            return;
        }

        if (isInLabel(d, d3.mouse(this))) {
            return;
        }

        hideActiveLabel();

        d.dragInfo = undefined;
    }


    function hideActiveLabel() {
        if (!$d3.activeLabel) {
            return;
        }

        $d3.activeLabelLayer.style("visibility", "hidden");
        $d3.activeLabelLayer.selectAll(".handle-layer")
            .style("visibility", "hidden");
        $d3.activeLabel.classed("active", false);

        $d3.activeLabel = null;
    }


    function isInLabel(d, pt) {
        var mx = pt[0];
        var my = pt[1];
        var x = vp.sec2x(d.startS());
        var w = vp.sec2width(d.durS());
        var sp = 4;

        if (x + sp <= mx && mx < x + w - sp && my >= sp && my < F_HEIGHT - sp) {
            return true;
        }

        return false;
    }


    function canZoomIn() { return vp.canZoomIn(); }
    function zoomIn() { vp.zoomIn(); z.toolbar.setEnable(); }
    function canZoomOut() { return vp.canZoomOut(); }
    function zoomOut() { vp.zoomOut(); z.toolbar.setEnable(); }


    function getVisibleLabels(srcLabels) {
        var labels = [];

        for (var i = 0; i < srcLabels.length; i++) {
            var label = srcLabels[i];

            if (vp.isVisible(label.startS(), label.endS())) {
                labels.push(label);
            }
        }

        return labels;
    }


    function onMouseWheel() {
        var delta = Math.max(-1, Math.min(1, (d3.event.wheelDelta || -d3.event.detail)));
        var x = d3.mouse(this)[0];
        var sec = vp.x2sec(x);

        if (delta < 0) {
            if (canZoomOut()) {
                zoomOut(sec);
            }
        } else {
            if (canZoomIn()) {
                zoomIn(sec);
            }
        }

        var newStartS = sec - vp.width2sec(x);
        vp.startS(newStartS);

        d3.event.preventDefault();
    }


    function label2rgb(d) {
        var c = d.colour();

        return ["rgb(", c[0], ",", c[1], ",", c[2], ")"].join("");
    }


    function tranStr(x, y) {
        return ["translate(", x, ",", y, ")"].join("");
    }
})();
