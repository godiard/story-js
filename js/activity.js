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

        var recordButton = document.getElementById("record");
        var playAudioButton = document.getElementById("play-audio");

        if (onAndroid) {
            // hide activity and close buttons on android
            var activityButton = document.getElementById("activity-button");
            var stopButton = document.getElementById("stop-button");
            var firstSeparator = document.getElementById("first-separator");
            activityButton.style.display = 'none';
            stopButton.style.display = 'none';
            firstSeparator.style.display = 'none';
        } else {
            recordButton.style.display = 'none';
            playAudioButton.style.display = 'none';
        };

        // HERE GO YOUR CODE

        require("story");
        require("filesaver");
        require("persistence");
        var cordobaIO = new persistence.CordobaIO();
        var recording = false;

        var textEditor = document.getElementById("textEditor");
        textEditor.style.width = (window.innerWidth - sugarCellSize * 2) + 'px' ;
        textEditor.style.height = "160px";
        textEditor.style.left = sugarCellSize + "px";
        textEditor.style.top = "15px";
        textEditor.style.display = 'block';
        textEditor.placeholder = _('WriteHere');

        var mainCanvas = document.getElementById("mainCanvas");
        mainCanvas.width = window.innerWidth - sugarCellSize * 4;
        mainCanvas.height = window.innerWidth - sugarCellSize * 4;
        mainCanvas.style.left = (sugarCellSize * 2) + "px";
        mainCanvas.style.top = "185px";
        mainCanvas.style.display = 'block';

        var help = document.getElementById("help");
        help.innerHTML = _('DragImages');

        var storyViewer = story.StoryViewer(mainCanvas);
        storyViewer.init();
        storyViewer.animate();

        var reloadBtn = document.getElementById("reload");
        reloadBtn.addEventListener('click', function(e) {
            storyViewer.init();
            storyViewer.animate();
        });

        // load images
        var imageChooser = document.getElementById('image-loader');

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

        var saveImageButton = document.getElementById("save-as-image");

        saveImageButton.addEventListener('click', function(e) {
            if (onAndroid) {
                story.saveAsImage(null);
                activity.showAlert(_('ImageSaved'),
                    _('TheImageIsSavedInYourGallery'), null, null);
            } else {
                story.saveAsImage(function(blob) {
                    saveAs(blob, "story.png");
                });
            };
        });

        var savePdfButton = document.getElementById("save-as-pdf");

        savePdfButton.addEventListener('click', function(e) {
            activity.showAlert(_('SavingPDF'),
                _('CreatingPDFFIle'), null, null);

            story.saveAsPdf(textEditor.value ,function(blob) {
                if (onAndroid) {
                    var fileName = "story_" + story.getImageNames() + ".pdf";
                    cordobaIO.save(blob, fileName);
                    window.plugins.fileOpener.open(
                        cordova.file.externalApplicationStorageDirectory +
                        fileName);
                } else {
                    saveAs(blob, "story.pdf");
                };

            });
        });

        storyViewer.saveAsImageBtn = saveImageButton;
        storyViewer.saveAsPdfBtn = savePdfButton;

        recordButton.addEventListener('click', function(e) {
            if (! recording) {
                // TODO start record
                if (!audioRecorder)
                    return;
                audioRecorder.clear();
                audioRecorder.record();
            } else {
                // TODO stop record
                audioRecorder.stop();
                audioRecorder.getBuffers( gotBuffers );

                playAudioButton.disabled = false;
            };
            recordButton.classList.toggle('active');
            recording = ! recording;
        });

        playAudioButton.addEventListener('click', function(e) {
            console.log('Play audio');
            // TODO start play
        });

        window.AudioContext = window.AudioContext || window.webkitAudioContext;

        var audioContext = new AudioContext();
        var audioInput = null,
            realAudioInput = null,
            inputPoint = null,
            audioRecorder = null;
        var recIndex = 0;

        function gotBuffers(buffers) {
            // so here's where we should set up the download.
            audioRecorder.exportWAV( doneEncoding );
        };

        function doneEncoding(blob) {
            var fileName = "story_" + story.getImageNames() + ".wav";
            cordobaIO.save(blob, fileName);
        };

        function gotStream(stream) {
            inputPoint = audioContext.createGain();

            // Create an AudioNode from the stream.
            realAudioInput = audioContext.createMediaStreamSource(stream);
            audioInput = realAudioInput;
            audioInput.connect(inputPoint);

            audioRecorder = new Recorder( inputPoint );

            zeroGain = audioContext.createGain();
            zeroGain.gain.value = 0.0;
            inputPoint.connect( zeroGain );
            zeroGain.connect( audioContext.destination );
        };

        function initAudio() {
            if (!navigator.getUserMedia)
                navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

            navigator.getUserMedia(
            {
                "audio": {
                    "mandatory": {
                        "googEchoCancellation": "false",
                        "googAutoGainControl": "false",
                        "googNoiseSuppression": "false",
                        "googHighpassFilter": "false"
                    },
                    "optional": []
                },
            }, gotStream, function(e) {
                alert('Error getting audio');
                console.log(e);
            });
        };

        initAudio();

    });

});
