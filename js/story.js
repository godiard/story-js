// 40 high-chroma colors [value, chroma, RGB]
// (copied from walter turtleartjs munsell.js)
COLORS40 = [
    [6, 24, "#ff007e"],
    [6, 24, "#ff0066"],
    [6, 24, "#ff0048"],
    [6, 26, "#ff0000"],
    [6, 26, "#ff3000"],
    [6, 20, "#fd6600"],
    [8, 24, "#ffa300"],
    [8, 22, "#ffb000"],
    [8, 22, "#ffb900"],
    [8, 22, "#ffc000"],
    [9, 22, "#ffe400"],
    [9, 22, "#ffe800"],
    [9, 22, "#f6ee00"],
    [9, 22, "#e1f400"],
    [9, 22, "#c4fb00"],
    [8, 28, "#4eeb00"],
    [8, 22, "#00f200"],
    [8, 28, "#00fd3c"],
    [6, 28, "#00c260"],
    [6, 28, "#00c273"],
    [6, 28, "#00c286"],
    [6, 28, "#00c29d"],
    [6, 26, "#00c1b6"],
    [6, 24, "#00c0ca"],
    [6, 24, "#00c0e7"],
    [6, 20, "#00b9f1"],
    [6, 20, "#00b5ff"],
    [6, 20, "#00b0ff"],
    [6, 20, "#00abff"],
    [6, 18, "#00a1ff"],
    [4, 28, "#005dff"],
    [4, 28, "#4231ff"],
    [4, 28, "#8000fe"],
    [4, 28, "#a000ef"],
    [6, 28, "#f009ff"],
    [6, 28, "#ff00ff"],
    [6, 28, "#ff00f9"],
    [6, 28, "#ff00d9"],
    [6, 26, "#ff00b2"],
    [6, 24, "#ff0098"]
];


define(function (require) {

    require("easel");
    require("tween");
    require("canvasToBlob");
    // this is a array with the list of images available
    var images = require('images');

    var localizationData = require("localizationData");
    var lang = navigator.language.substr(0, 2);

    function _(text) {
        // copied from activity.js
        translation = localizationData[lang][text];
        if (translation == '') {
            translation = text;
        };
        return translation;
    };

    var onAndroid = /Android/i.test(navigator.userAgent);

    var smallScreen = (window.innerWidth < 700) || (window.innerHeight < 600);
    var font = smallScreen ? "16px Arial" : "24px Arial";

    var LINE_WIDTH = 1;
    var BLACK = "#000000";
    var WHITE = "#ffffff";

    var DEFAULT_FONT_SIZE = 14;

    CANT_TILES = 3;
    MIN_DRAG_DIST = 20;
    story = {};

    function StoryViewer(canvas) {

        this.canvas = canvas;
        this._width = canvas.width - LINE_WIDTH * 2;
        this._height = canvas.height - LINE_WIDTH * 2;

        this.stage = new createjs.Stage(canvas);
        // Enable touch interactions if supported on the current device
        createjs.Touch.enable(this.stage);
        this._tileSize = this._height / CANT_TILES;
        this._animContainer = null;
        this._tiles = [];

        this.init = function () {
            this.stage.removeAllChildren();
            this._backContainer = new createjs.Container();
            this.stage.addChild(this._backContainer);
            this.stage.update();
        };

        this.animate = function() {
            createjs.Ticker.setInterval(1000);
            createjs.Ticker.addEventListener("tick", tick);
            var step = 5;
            var viewer = this;
            function tick() {
                step = step - 1;
                if (step > 0) {
                    viewer.showRandomCircles();
                } else {
                    createjs.Ticker.removeEventListener("tick", tick);
                    // Here we need load all the images and remove the circles
                    viewer.loadImages();
                };
            };
        };

        this.showRandomCircles = function() {
            if (this._animContainer == null) {
                this._animContainer = new createjs.Container();
                this.stage.addChild(this._animContainer);
            } else {
                this._animContainer.removeAllChildren();
            }

            this._circles = [];
            for (var n=0; n < 6; n++) {
                var i = Math.round(Math.random() * CANT_TILES);
                var j = Math.round(Math.random() * CANT_TILES);
                var s = new createjs.Shape();
                var color = COLORS40[
                    Math.round(Math.random() * (COLORS40.length - 1))][2];
                s.graphics.beginFill(color);
                s.graphics.drawCircle((i + 0.5) * this._tileSize,
                             (j + 0.5) * this._tileSize,
                             this._tileSize / 2);
                this._animContainer.addChild(s);
            };

            var questionMark = new createjs.Text("?", "60px Arial", "#000000");
            var height = questionMark.getMeasuredHeight();
            questionMark.scaleX = this._tileSize * 0.75/ height;
            questionMark.scaleY = this._tileSize * 0.75/ height;
            questionMark.textAlign = "center";
            questionMark.textBaseline = "middle";

            for (var i=0; i < CANT_TILES; i++) {
                for (var j=0; j < CANT_TILES; j++) {
                    var q = questionMark.clone();
                    q.x = (i + 0.5) * this._tileSize;
                    q.y = (j + 0.5) * this._tileSize;
                    this._animContainer.addChild(q);
                };
            };

            this.stage.update();
        };

        this.loadImages = function() {
            this._imageCounter = 9;
            // get a list of 9 unique random image names
            var selectedImages = [];
            while (selectedImages.length < 9) {
                var imageName = images[
                    Math.round(Math.random() * (images.length - 1))];
                if (selectedImages.indexOf(imageName) == -1) {
                    selectedImages.push(imageName);
                };
            };
            // add the images to the canvas
            this._tiles = [];
            for (var i=0; i < CANT_TILES; i++) {
                this._tiles.push([]);
                for (var j=0; j < CANT_TILES; j++) {
                    this._tiles[i].push(null);
                    url = './images/' + selectedImages.pop();
                    this.createAsyncBitmap(url, i, j, null)
                };
            };
        };

        this.showLoadedImages = function() {
            // show the loaded images when are all loaded
            if (this._imageCounter > 1) {
                this._imageCounter = this._imageCounter - 1;
                return;
            };
            this.stage.removeChild(this._animContainer);
            this._animContainer = null;
            this.stage.update();
            createjs.Ticker.addEventListener("tick", this.stage);
            // return the ticker to the standard interval to do the drag animation
            createjs.Ticker.setInterval(50);
        };

        this.createAsyncBitmap = function(url, i, j, callback) {
            // Async creation of bitmap from SVG data
            // Works with Chrome, Safari, Firefox (untested on IE)
            var viewer = this;
            var img = new Image();
            img.onload = function () {
                bitmap = new createjs.Bitmap(img);
                bitmap.setBounds(0, 0, img.width, img.height);
                bounds = bitmap.getBounds();
                var scale = viewer._tileSize / bounds.height;
                bitmap.scaleX = scale;
                bitmap.scaleY = scale;
                bitmap.x = i * viewer._tileSize;
                bitmap.y = j * viewer._tileSize;
                bitmap.i = i;
                bitmap.j = j;
                viewer._tiles[i][j] = bitmap;

                var hitArea = new createjs.Shape();
                hitArea.graphics.beginFill("#000").drawRect(0, 0,
                    img.width, img.height);
                bitmap.hitArea = hitArea;

                bitmap.on("mousedown",function(event) {
                    // set the initial mouse down position to calculate later
                    // the drag direction
                    bitmap.pressX = event.stageX;
                    bitmap.pressY = event.stageY;
                }, bitmap);

                bitmap.on("pressup",function(event) {
                    var deltaX = event.stageX - bitmap.pressX;
                    var deltaY = event.stageY - bitmap.pressY;
                    if (Math.abs(deltaX) < MIN_DRAG_DIST &&
                        Math.abs(deltaY) < MIN_DRAG_DIST) {
                        return;
                    };
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        var direction = 'X';
                        var value = deltaX > 0 ? 1 : -1;
                    } else {
                        var direction = 'Y';
                        var value = deltaY > 0 ? 1 : -1;
                    };

                    console.log('drag ' + this.i + ' ' + this.j,
                                'TO ' + direction + ' ' + value);
                    viewer.dragImage(this, direction, value);
                }, bitmap);

                viewer._backContainer.addChild(bitmap);
                viewer.showLoadedImages();
                //callback(container, x, y, bitmap);
            };
            img.onerror = function (errorMsg, url, lineNumber) {
                console.log('Error loading ' + url);
            };
            img.src = url;
        };

        this.dragImage = function(bitmap, direction, value) {
            // verify if can swith in the requested direction/value
            var coord = (direction == 'X') ? bitmap.i : bitmap.j;
            if ((value == -1 && coord == 0) ||
                (value == 1 && coord == CANT_TILES - 1)) {
                console.log('Out of limits');
                return;
            };
            // identify the piece to make the swap
            var i1 = bitmap.i;
            var j1 = bitmap.j;
            var i2 = i1;
            var j2 = j1;
            if (direction == 'X') {
                i2 = i1 + value;
            } else {
                j2 = j1 + value;
            };

            // store the end coordinates
            var x1 = bitmap.x;
            var y1 = bitmap.y;
            var bitmap2 = this._tiles[i2][j2];
            var x2 = bitmap2.x;
            var y2 = bitmap2.y;

            createjs.Tween.get(bitmap).to({x:x2,y:y2}, 500,
                createjs.Ease.linear).call(
                    this.endDrag(i1, j1, i2, j2)
                );
            createjs.Tween.get(bitmap2).to({x:x1,y:y1}, 500,
                               createjs.Ease.linear);
        };

        this.endDrag = function(i1, j1, i2, j2){
            var bitmap1 = this._tiles[i1][j1];
            var bitmap2 = this._tiles[i2][j2];
            // swap the values i and j
            bitmap1.i = i2;
            bitmap1.j = j2;
            bitmap2.i = i1;
            bitmap2.j = j1;
            // swap the bitmap positions in the matrix
            this._tiles[i1][j1] = bitmap2;
            this._tiles[i2][j2] = bitmap1;
        };

        this.saveAsImage = function(callback) {
            if (callback != null) {
                this.canvas.toBlob(callback);
            } else {
                // use cordova plugin from
                // https://github.com/devgeeks/Canvas2ImagePlugin
                window.canvas2ImagePlugin.saveImageDataToLibrary(
                    function(msg){
                        console.log(msg);
                    },
                    function(err){
                        console.log(err);
                    },
                    this.canvas);
            };
        };

        return this;
    };

    story.StoryViewer = StoryViewer;

    return story;
});



