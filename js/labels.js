(function() {
    "use strict";

    z.createLabels = createLabels;


    var reLabel = /^(\d+(\.\d{0,6})?)\s+(\d+(\.\d{0,6})?)\s+(.*)/;


    function Labels() {}
    Labels.prototype = Object.create(Array.prototype);


    function createLabels(labelsStr) {
        var my = new Labels();

        my.toString = function () {
            var strArr = [];

            for (var i = 0; i < my.length; i++) {
                strArr.push(my[i].toString());
            }

            return strArr.join("\n");
        };


        my.clone = function () {
            var labels = createLabels();

            for (var i = 0; i < my.length; i++) {
                labels.push(my[i].clone());
            }

            return labels;
        };


        my.canInsertLabel = function (posS, durS, maxS) {
            var rng = my.getInsertableRange(posS, durS, maxS);

            if (rng) {
                return true;
            } else {
                return false;
            }
        };


        my.insertLabel = function (posS, durS, maxS) {
            var rng = my.getInsertableRange(posS, durS, maxS);

            if (!rng) {
                return;
            }

            var start, end;

            if (posS - rng[0] < durS / 2) {
                start = rng[0];
                end = start + durS;
            } else if (rng[1] - posS < durS / 2) {
                end = rng[1];
                start = end - durS;
            } else {
                start = posS - (durS / 2);
                end = start + durS;
            }

            var label = z.createPauseLabel(start, end);
            my.sortedAdd(label);
        };


        my.canCut = function (posS) {
            for (var i = 0; i < my.length; i++) {
                var label = my[i];

                if (label.contains(posS)) {
                    if (posS < label.startS() + 0.1 || label.endS() - 0.1 < posS) {
                        continue;
                    }

                    return true;
                }
            }

            return false;
        };


        my.cut = function (posS) {
            for (var i = 0; i < my.length; i++) {
                var label = my[i];

                if (label.contains(posS)) {
                    var newLabel = z.createPauseLabel(posS, label.endS());
                    label.endS(posS);
                    my.splice(i + 1, 0, newLabel);
                    break;
                }
            }

            return my;
        };


        my.getPrev = function (label) {
            var i = my.indexOf(label);

            if (i <= 0) {
                return null;
            }

            return my[i - 1];
        };


        my.getNext = function (label) {
            var i = my.indexOf(label);

            if (i === -1 || i === my.length - 1) {
                return null;
            }

            return my[i + 1];
        };


        my.remove = function (label) {
            var i = my.indexOf(label);

            if (i !== -1) {
                my.splice(i, 1);
            }
        };


        my.canLeftMerge = function (label) {
            if (my.getPrev(label)) {
                return true;
            } else {
                return false;
            }
        };


        my.leftMerge = function (label) {
            var prev = my.getPrev(label);

            if (!prev) {
                return;
            }

            label.startS(prev.startS());
            my.remove(prev);
        };


        my.canRightMerge = function (label) {
            if (my.getNext(label)) {
                return true;
            } else {
                return false;
            }
        };


        my.rightMerge = function (label) {
            var next = my.getNext(label);

            if (!next) {
                return;
            }

            label.endS(next.endS());
            my.remove(next);
        };


        my.sortedAdd = function (newLabel) {
            for (var i = 0; i < my.length; i++) {
                var label = my[i];

                if (label.endS() > newLabel.endS()) {
                    my.splice(i, 0, newLabel);
                    return;
                }
            }

            my.push(newLabel);
        };


        my.getInsertableRange = function (posS, durS, maxS) {
            if ((posS < 0) || (maxS < posS) || (durS <= 0) || (maxS < durS)) {
                return null;
            }

            var rng = [0, maxS];

            for (var i = 0; i < my.length; i++) {
                var label = my[i];

                if (label.contains(posS)) {
                    return null;
                }

                if (label.endS() < posS) {
                    rng[0] = label.endS();
                }

                if (posS < label.startS()) {
                    rng[1] = label.startS();
                    break;
                }
            }

            if (durS <= rng[1] - rng[0]) {
                return rng;
            }

            return null;
        };


        my.loadFromStr = function (str, maxS) {
            var lines = str.split("\n");

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];

                var m = reLabel.exec(line);

                try {
                    var st = parseFloat(m[1]);
                    var ed = parseFloat(m[3]);
                    var type = m[5];

                    if (st < 0 || st > maxS || st >= ed || type !== "p") {
                        continue;
                    }

                    if (ed > maxS) {
                        ed = maxS;
                    }

                    if (ed - st < z.MIN_DUR_S) {
                        continue;
                    }

                    my.sortedAdd(z.createPauseLabel(st, ed));
                } catch (e) {
                }
            }
        };


        return my;
    }
})();
