(function() {
    "use strict";

    z.file = {
        init: init
    };


    var fileSelect, fileDrag,
        reTxt = /.*\.txt$/i;


    function init() {
        if (!(window.File && window.FileList && window.FileReader)) {
            return false;
        }

        fileSelect = d3.select("#file-select");
        fileDrag = d3.select("#viz");

        fileSelect.on("change", fileSelectHandler);

        fileDrag.on("dragover", fileDragHover);
        fileDrag.on("dragleave", fileDragHover);
        fileDrag.on("drop", fileSelectHandler);
    }


    function fileSelectHandler() {
        fileDragHover();

        var files = this.files || d3.event.dataTransfer.files;

        for (var i = 0; i < files.length; i++) {
            var file = files[i];


            if (reTxt.exec(file.name)) {
                if (!window.FileReader) {
                    continue;
                }

                var reader = new window.FileReader();
                reader.readAsText(file);

                reader.onload = function (e) {
                    var contents = e.target.result;
                    var labels = z.createLabels();
                    labels.loadFromStr(contents, z.durS);

                    if (labels.length > 0) {
                        z.setLabels(labels);
                    }
                };
            } else {
                z.audio.load(z.context, URL.createObjectURL(file), z.onLoadAudio);
            }
        }
    }


    function fileDragHover() {
        d3.event.stopPropagation();
        d3.event.preventDefault();

        if (d3.event.type === "dragover") {
            fileDrag.className = "hover";
        } else {
            fileDrag.className = "";
        }
    }
})();
