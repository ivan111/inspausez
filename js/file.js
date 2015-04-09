(function() {
    "use strict";

    window.z.file = {
        init: init
    };


    var fileSelect, fileDrag;


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

        window.console.log(URL.createObjectURL(files[0]));
        z.audio.load(z.context, URL.createObjectURL(files[0]), z.onLoadAudio);
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
