requirejs.config({
    baseUrl: "lib",
    shim: {
        easel: {
            exports: "createjs"
        },
    },
    paths: {
        activity: "../js",
        easel: "../lib/easeljs-0.8.1.min",
        preload: "../lib/preloadjs-0.6.1.min",
        tween: "../lib/tweenjs-0.6.1.min",
        images: "../js/images",
        story: "../js/story",
        localizationData: "../js/localization_data",
        filesaver: "../lib/FileSaver.min",
        persistence: "../js/persistence",
        canvasToBlob: "../lib/canvas-toBlob",
        pdfkit: "../lib/pdfkit",
        blobstream: "../lib/blob-stream",
        buffer: "../lib/buffer",
        // images path
        images_path: "../images"
    }
});

requirejs(["activity/activity"]);
