(function() {
    "use strict";

    z.createHistory = createHistory;


    var MAX_HISTORY = 100;


    function createHistory(firstLabels) {
        var labelsList = [firstLabels.clone()];
        var curPos = 0;


        function my() {
        }


        my.toString = function () {
            return ["history: length = ", labelsList.length, ", current index = ", curPos].join("");
        };


        my.save = function (labels) {
            if (curPos + 1 < labelsList.length) {
                labelsList.length = curPos + 1;
            }

            labelsList.push(labels.clone());
            curPos++;

            if (labelsList.length > MAX_HISTORY) {
                labelsList.shift();
                curPos--;
            }

            return my;
        };


        my.canUndo = function () {
            return curPos !== 0;
        };


        my.undo = function () {
            if (!my.canUndo()) {
                return null; // error
            }

            return labelsList[--curPos].clone();
        };


        my.canRedo = function () {
            return curPos !== labelsList.length - 1;
        };


        my.redo = function () {
            if (!my.canRedo()) {
                return null; // error
            }

            return labelsList[++curPos].clone();
        };


        return my;
    }
})();
