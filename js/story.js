define(function (require) {

    require("easel");

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

    story = {};

    function createAsyncBitmap(box, url, callback) {
        // Async creation of bitmap from SVG data
        // Works with Chrome, Safari, Firefox (untested on IE)
        var img = new Image();
        img.onload = function () {
            bitmap = new createjs.Bitmap(img);
            bitmap.setBounds(0, 0, img.width, img.height);
            bitmap.mouseEnabled = false;
            callback(box, bitmap);
        };
        img.onerror = function (errorMsg, url, lineNumber) {
            callback(box, null);
        };
        img.src = url;
    };

    function createAsyncBitmapButton(globe, url, callback) {
        // creates a square black button with a image inside
        // is used for the corner controls in the globe
        var img = new Image();
        img.cont = null;
        img.globe = globe;

        img.onload = function () {
            var bitmap = new createjs.Bitmap(img);
            bitmap.setBounds(0, 0, img.width, img.height);
            bounds = bitmap.getBounds();
            var scale = SIZE_RESIZE_AREA / bounds.height;
            bitmap.scaleX = scale;
            bitmap.scaleY = scale;

            if (this.cont == null) {
                this.cont = new createjs.Container();
                this.cont.name = 'button';
                var hitArea = new createjs.Shape();
                hitArea.graphics.beginFill("#000").drawRect(0, 0,
                    SIZE_RESIZE_AREA, SIZE_RESIZE_AREA);
                this.cont.width = SIZE_RESIZE_AREA;
                this.cont.height = SIZE_RESIZE_AREA;
                this.cont.hitArea = hitArea;
                this.cont.addChild(hitArea);
                this.cont.addChild(bitmap);
                callback(this.globe, this.cont);
            };
        };
        img.src = url;
        return img;
    };


    function StoryViewer(canvas) {

        this.canvas = canvas;
        this._width = canvas.width - LINE_WIDTH * 2;
        this._height = canvas.height - LINE_WIDTH * 2;

        this.stage = new createjs.Stage(canvas);
        // Enable touch interactions if supported on the current device
        createjs.Touch.enable(this.stage);
        this._tileSize = this._height / 3;
        this._animContainer = null;

        this.init = function () {
            this.stage.removeAllChildren();
            this._backContainer = new createjs.Container();
            var background = new createjs.Shape();
            background.graphics.setStrokeStyle(LINE_WIDTH, "round");
            background.graphics.beginStroke(
                BLACK).drawRect(LINE_WIDTH, LINE_WIDTH,
                                this._width, this._height);
            this.stage.addChild(this._backContainer);
            this._backContainer.addChild(background);
            this._backContainer.cache(0, 0, this.canvas.width, this.canvas.height);
            this.stage.update();
        };


        this.animate = function() {
            createjs.Ticker.setInterval(1000);
            createjs.Ticker.addEventListener("tick", tick);
            var step = 10;
            var viewer = this;
            function tick() {
                viewer.showRandomCircles();
                console.log(step);
                if (step > 0) {
                    step = step - 1;
                } else {
                    console.log('PAUSE');
                    createjs.Ticker.removeEventListener("tick", tick);
                    // Here we need load all the images and remove the circles

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
            for (var i=0; i < 3; i++) {
                for (var j=0; j < 3; j++) {
                    if (Math.random() > 0.5) {
                        var s = new createjs.Shape();
                        s.graphics.beginFill(createjs.Graphics.getRGB(255,0,0));
                        s.graphics.drawCircle((i + 0.5) * this._tileSize,
                                     (j + 0.5) * this._tileSize,
                                     this._tileSize / 2);
                        this._animContainer.addChild(s);
                    };
                };
            };
            this.stage.update();
        };

        return this;
    };


    story.StoryViewer = StoryViewer;

    return story;
});



