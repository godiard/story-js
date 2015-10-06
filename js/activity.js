define(function (require) {
    var activity = require("sugar-web/activity/activity");

    // initialize canvas size
    var onAndroid = /Android/i.test(navigator.userAgent);
    if (window.location.search.indexOf('onAndroid') > -1) {
        onAndroid = true;
    };

    var loadTestData = false;
    if (window.location.search.indexOf('loadTestData') > -1) {
        loadTestData = true;
    };

    var onXo = ((window.innerWidth == 1200) && (window.innerHeight >= 900));
    var sugarCellSize = 75;
    var sugarSubCellSize = 15;
    if (!onXo && !onAndroid) {
        sugarCellSize = 55;
        sugarSubCellSize = 11;
    };

    var localizationData = require("localizationData");
    var lang = navigator.language.substr(0, 2);
    console.log('LANG ' + lang);

    function _(text) {
        // this function add a fallback for the case of translation not found
        // can be removed when we find how to read the localization.ini
        // file in the case of local html file opened in the browser
        translation = localizationData[lang][text];
        if (translation == '') {
            translation = text;
        };
        return translation;
    };

    // Manipulate the DOM only when it is ready.
    require(['domReady!'], function (doc) {

        // Initialize the activity.
        activity.setup();

        if (onAndroid) {
            // hide activity and close buttons on android
            var activityButton = document.getElementById("activity-button");
            var stopButton = document.getElementById("stop-button");
            var firstSeparator = document.getElementById("first-separator");
            activityButton.style.display = 'none';
            stopButton.style.display = 'none';
            firstSeparator.style.display = 'none';
        };

        // HERE GO YOUR CODE

        require("story");
        require("filesaver");
        require("persistence");
        var cordobaIO = new persistence.CordobaIO();

        var mainCanvas = document.getElementById("mainCanvas");
        // remove 5 more to be sure no scrollbars are visible
        mainCanvas.height = window.innerHeight - sugarCellSize - 5;
        mainCanvas.width = mainCanvas.height * 4 / 3;
        mainCanvas.style.left = ((window.innerWidth - mainCanvas.width) / 2) + "px";

        var toonModel = new toon.Model(initialData, mainCanvas, tp);
        toonModel.init();
        toonModel.attachPrevNextButtons(previousButton, nextButton);

        // load images
        var imageChooser = document.getElementById('image-loader');

        var addButton = document.getElementById("add-button");
        addButton.addEventListener('click', function (e) {
            imageChooser.focus();
            imageChooser.click();
        });

        // load fototoon files
        var JSZip = require("jszip");
        var toonChooser = document.getElementById('fototoon-loader');

        // this part is a fake file selector to use in android
        var fileSelector = document.getElementById('file-selector');

        function selectFile(fileName) {
            fileName = fileName + '.fototoon';
            cordobaIO.read(fileName, function(content) {
                var zip = new JSZip(content);
                readFototoonFile(zip);
            });

            closeSelector();
        };

        function closeSelector() {
            fileSelector.style.display = 'none';
            mainCanvas.style.display = 'block';
        };

        function startFileSelection(fileList) {
            if (fileList.length == 0) {
                activity.showAlert(_('FileNotFound'), '', null, null);
                return;
            };
            mainCanvas.style.display = 'none';

            // create file list entries
            var content = '';
            for (var i = 0; i < fileList.length; i++) {
                var filePath = fileList[i];
                var fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
                fileName = fileName.substring(0, fileName.indexOf('.fototoon'));
                content = content + '<button id="' + fileName + '">' +
                    fileName + '</button><br/>';
            };

            // add a button to close the file selector
            content = content + '<button id="exit-file-selector">' +
                '<img src="./icons/dialog-cancel-black.svg">'
                '</button>';

            fileSelector.style.left = ((window.innerWidth - 500) / 2) + "px";

            fileSelector.style.display = 'block';
            fileSelector.innerHTML = content;
            var buttons = fileSelector.querySelectorAll('button');
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].id != 'exit-file-selector') {
                    buttons[i].addEventListener('click', function(e) {
                        selectFile(e.target.id);
                    });
                } else {
                    buttons[i].addEventListener('click', function(e) {
                        closeSelector();
                    });
                };
            };
        };

        toonChooser.addEventListener('click', function (event) {
            this.value = null;
        });

        function readFototoonFile(zip) {
            // read the content of the file with JSZip
            var data = {};
            // NOTE: This code assume data.json file
            // is stored before the images
            $.each(zip.files, function (index, zipEntry) {
                console.log('reading ' + zipEntry.name);
                if (zipEntry.name == 'data.json') {
                    data = JSON.parse(zipEntry.asText());
                    if (data['images'] == undefined) {
                        data['images'] = {};
                    };
                } else {
                    // load the image data in a blob, and read
                    // with a filereader to store as a data url
                    var imageBlob = new Blob(
                        [zipEntry.asArrayBuffer()], {type: 'image/png'});
                    var reader = new FileReader();
                    reader.onloadend = (function () {
                        // store the image data in the model data
                        data['images'][zipEntry.name] = reader.result;
                    });
                    reader.readAsDataURL(imageBlob);
                };
            });

            toonModel.setData(data);
            if (!editMode) {
                toonModel.changeToEditMode();
                editMode = true;
            };

        };

        toonChooser.addEventListener('change', function (event) {
            // Read file here.
            var reader = new FileReader();
            reader.onload = (function(theFile) {
                return function(e) {
                    try {
                        // read the content of the file with JSZip
                        var zip = new JSZip(e.target.result);
                        readFototoonFile(zip);
                    } catch(e) {
                        console.log('Exception ' + e.message);
                        console.log('Reading file ' + theFile.name);
                    };
                };
            })(file);
            var file = toonChooser.files[0];
            if (file) {
                reader.readAsArrayBuffer(file);
            };
        }, false);

        function dataURItoString(dataURI) {
            // from http://stackoverflow.com/questions/4998908/
            // convert-data-uri-to-file-then-append-to-formdata/5100158#5100158
            // convert base64/URLEncoded data component to raw binary data held in a string
            var byteString;
            if (dataURI.split(',')[0].indexOf('base64') >= 0)
                byteString = atob(dataURI.split(',')[1]);
            else
                byteString = unescape(dataURI.split(',')[1]);

            return byteString;
        };

        var saveButton = document.getElementById("doc-save");
        saveButton.addEventListener('click', function (e) {
            zip = new JSZip();
            // this line is enough to read the file on the js version
            // because the images data is stored as data uris.
            // but the objective is have  file format compatible
            // with the python version

            // zip.file("data.json", JSON.stringify(toonModel.getData()));

            if (!editMode) {
                toonModel.finishSort();
                toonModel.init();
                editMode = true;
            };

            this.finishSort
            // clone the data to remove the images
            var dataWithoutImages = {}
            dataWithoutImages['version'] = toonModel.getData()['version'];
            dataWithoutImages['boxs'] = toonModel.getData()['boxs'];
            zip.file("data.json", JSON.stringify(dataWithoutImages));

            for(var key in toonModel.getData()['images']) {
                var imageName = key;
                console.log('saving image ' + imageName);
                zip.file(imageName,
                         dataURItoString(toonModel.getData()['images'][imageName]),
                         {'binary': true});
            };

            var blob = zip.generate({type:"blob"});
            if (onAndroid) {
                cordobaIO.save(blob, toonModel.getTitle() + ".fototoon");
                activity.showAlert(_('ToonSaved'),
                    _('FileSavedSuccessfully'), null, null);
            } else {
                saveAs(blob, toonModel.getTitle() + ".fototoon");
            };
        });

        var saveImageButton = document.getElementById("image-save");

        saveImageButton.addEventListener('click', function(e) {
            if (onAndroid) {
                toonModel.saveAsImage(this.id, null);
                activity.showAlert(_('ImageSaved'),
                    _('TheImageIsSavedInYourGallery'), null, null);
            } else {
                toonModel.saveAsImage(this.id, function(blob) {
                    saveAs(blob, "fototoon.png");
                });
            };
        });


    });

});
