define(function (require) {

    require("easel");

    require("canvasToBlob");

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

        this.init = function (data, imagesData, canRemove) {
            this._data = data;
            this.imagesData = imagesData
            this.canRemove = canRemove;
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

            if (this._data != null) {
                if (this._data['image_name'] != '' &&
                    this._data['image_name'] != undefined) {
                    this._image_x = this._data['img_x'];
                    this._image_y = this._data['img_y'];
                    this._image_width = this._data['img_w'];
                    this._image_height = this._data['img_h'];
                    this._image_name = this._data['image_name'];
                    this._slideshow_duration = this._data['slideshow_duration'];

                    if (this.imagesData != null) {
                        this._setBackgroundImageDataUrl(
                            this.imagesData[this._image_name]);
                    };
                } else {
                    this._image_x = 0;
                    this._image_y = 0;
                    this._image_width = canvas.width;
                    this._image_height = canvas.height;
                    this._image_name = '';
                    this._slideshow_duration = 10;
                    this.createGlobes();
                };
            };
            this.stage.update();
        };

        this._setBackgroundImageDataUrl = function(imageUrl) {
            this._image_x = 0;
            this._image_y = 0;
            this._image_width = this._width;
            this._image_height = this._height;
            var img = new Image();
            img.src = imageUrl;
            bitmap = new createjs.Bitmap(img);
            bitmap.setBounds(0, 0, img.width, img.height);
            // calculate scale
            var scale_x = this._width / img.width;
            var scale_y = this._height / img.height;
            var scale = Math.min(scale_x, scale_y);

            bitmap.mouseEnabled = false;
            bitmap.x = LINE_WIDTH;
            bitmap.y = LINE_WIDTH;
            bitmap.scaleX = scale;
            bitmap.scaleY = scale;
            this._backContainer.addChildAt(bitmap, 0);


        };
    };


    story.StoryViewer = StoryViewer;

    return story;
});



