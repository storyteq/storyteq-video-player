function StoryteqVideoPlayer(parameters) {
    var connector = this;
    if (!parameters.videoPlayerId) {
        throw new Error('Missing videoPlayerID.');
    }
    connector.videoPlayerId = parameters.videoPlayerId;
    connector.tracking = true;

    if (parameters.mediaData) {
        connector.mediaData = parameters.mediaData;
    } else if (parameters.videoHash) {
        connector.videoHash = parameters.videoHash;
    } else if (parameters.videoParameterName) {
        connector.videoHash = connector.getUrlParameter(parameters.videoParameterName);
    } else {
        throw new Error('Missing videoParameterName or videoHash or mediaData.');
    }

    if (parameters.verbose) {
        connector.verbose = parameters.verbose;
    }

    if (parameters.tracking == false) {
        connector.tracking = parameters.tracking;
    }

    if (parameters.dataCallbackFunction) {
        connector.dataCallbackFunction = parameters.dataCallbackFunction;
    }

    if (parameters.defaultUrls) {
        connector.defaultUrls = parameters.defaultUrls;
    }

    if (parameters.subs) {
        connector.subs = parameters.subs;
    }

    if (parameters.playerSetup) {
        connector.playerSetup = parameters.playerSetup;
    }

    if (parameters.events) {
        connector.events = parameters.events;
    }

    if (parameters.posterUrl) {
        connector.posterUrl = parameters.posterUrl;
    }

    if (parameters.noPoster) {
        connector.noPoster = parameters.noPoster;
    }

    // Video event variables
    connector.delta = 20;
    connector.durationOfVideo = null;
    connector.timecodes = [];
    connector.videoStarted = false;
    connector.firstPlay = true;
    connector.previousEvent = null;

    (function() {
        connector.loadVideoJsCss();
    }());
}

// Fallback for old implementation
function StoryteqConnectorJwPlayer(parameters) {
    return new StoryteqVideoPlayer(parameters);
}

StoryteqVideoPlayer.prototype.loadVideoJsCss = function(){
    var connector = this;
    var script = document.createElement('link');
    script.type = 'text/css';
    script.rel = 'stylesheet';
    script.href = 'https://storage.googleapis.com/storyteq-video-player/dist/video-js.min.css';
    if (script.readyState) { // IE
        if (script.readyState === 'loaded') {
            connector.loadVideoJsTheme();
        }
    } else { // Others
        script.onload = function() {
            connector.loadVideoJsTheme();
        }
    }
    
    document.getElementsByTagName('head')[0].appendChild(script);
}

StoryteqVideoPlayer.prototype.loadVideoJsTheme = function(){
    var connector = this;
    var script = document.createElement('link');
    script.type = 'text/css';
    script.rel = 'stylesheet';
    script.href = 'https://storage.googleapis.com/storyteq-video-player/dist/video-js-theme.min.css';
    if (script.readyState) { // IE
        if (script.readyState === 'loaded') {
            connector.loadVideoJs();
        }
    } else { // Others
        script.onload = function() {
            connector.loadVideoJs();
        }
    }
    document.getElementsByTagName('head')[0].appendChild(script);
}

StoryteqVideoPlayer.prototype.loadVideoJs = function(){
    var connector = this;
    var script = document.createElement('script');
    script.type = 'text/javascript';
    if (script.readyState) { // IE
        if (script.readyState === 'loaded') {
            // Get video data from StoryTEQ API
            connector.getVideoData();
        }
    } else { // Others
        script.onload = function() {
            // Get video data from StoryTEQ API
            connector.getVideoData();
        }
    }
    script.src = 'https://storage.googleapis.com/storyteq-video-player/dist/video-js.min.js';
    document.getElementsByTagName('head')[0].appendChild(script);
}

StoryteqVideoPlayer.prototype.createVideoPlayerInstance = function(response) {
    var connector = this;

    var videoElement = document.getElementById(connector.videoPlayerId);
    var videoPlayer = document.createElement('video');
    videoPlayer.id = connector.videoPlayerId;
    videoPlayer.className = 'video-js vjs-16-9';
    videoElement.parentNode.replaceChild(videoPlayer, videoElement);

    var playerInstance = videojs(connector.videoPlayerId, {
        poster: (connector.noPoster ? '': connector.posterUrl),
        sources: connector.videoUrl,
        controls: true,
        autoplay: true,
        preload: 'auto',
        muted: true
    });

    if (connector.videoUrl){
        if (connector.verbose) {
            console.log('Video embedded');
        }
        document.getElementById(videoPlayer.id).addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        connector.createAnalyticEmbed();
    }
    if (connector.events) {
        for (var event in connector.events) {
            playerInstance.on(event, connector.events[event]);
        }
    }

    // Fire off video event emitter
    this.videoEventEmitter(playerInstance);
}

StoryteqVideoPlayer.prototype.round = function(value, precision) {
    var multiplier = Math.pow(100, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

StoryteqVideoPlayer.prototype.videoEventEmitter = function(playerInstance) {
    var connector = this;

    playerInstance.on('seeked', function() {
        connector.timecodes.forEach(function(element) {
            element.passed = false;
        });
    });  

    setInterval(function(){
        var position = playerInstance.currentTime();
        //Dynamically fetch duration of video
        if (position > 1 && connector.durationOfVideo == null) {
            connector.durationOfVideo = playerInstance.duration();
            for (var i = 0; i <= connector.delta; i = i + 1) {
                connector.timecodes[i] = {
                    percentage: i * 1 / connector.delta,
                    value: i / connector.delta * connector.durationOfVideo,
                    passed: false
                };
            }
        }

        //Check if percentage points are passed
        if (connector.durationOfVideo != null) {
            connector.timecodes.forEach(function(element) {
                if (position >= element.value && (position - element.value) < connector.durationOfVideo / connector.delta && element.passed == false) {
                    var percentage = connector.round(element.percentage * 100, 1);
                    if (connector.previousEvent != percentage){
                        if (connector.verbose) {
                            console.log('Video watched for ' + percentage + '%');
                        }
                        connector.createAnalyticView(percentage);
                        element.passed = true;
                        connector.previousEvent = percentage;
                    }
                } else {
                    connector.skipNextEvent = false;
                }
            });
        }

    }, 500);
}

StoryteqVideoPlayer.prototype.analyticPostRequest = function(type, meta) {
    var connector = this;
    if ((this.mediaData != null || (this.videoHash != null && this.videoHash != '')) && this.tracking != false) {
        var hash = this.videoHash;
        if (this.mediaData != null) {
            hash = mediaData.hash;
        }
        var xhr = new XMLHttpRequest();
        var url = 'https://api.storyteq.com/v4/open/media/' + hash;

        xhr.open('POST', url);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-Content-Type-Options', 'nosniff');

        xhr.send(JSON.stringify({
            'type': type,
            'meta': meta
        }));
    } else {
        if (connector.verbose) {
            console.log('No analytics will be created since no unique hash has been provided or tracking has been disabled.');
        }
    }
}

StoryteqVideoPlayer.prototype.getVideoData = function() {
    var connector = this;
    if (!connector.videoHash || connector.videoHash === null) {

        if (connector.mediaData) {
            if (connector.mediaData.urls) {
                connector.setVideoUrl(connector.mediaData.urls.video);
                if (connector.mediaData.urls.gif) {
                    connector.setPosterUrl(connector.mediaData.urls.gif);
                } else if (connector.mediaData.urls.image) {
                    connector.setPosterUrl(connector.mediaData.urls.image);
                }
            } else {
                connector.setVideoUrl(connector.mediaData.video_url);
                connector.setPosterUrl(connector.mediaData.poster_url);
            }
            connector.createVideoPlayerInstance({data:connector.mediaData});

            // Create device event
            connector.createAnalyticDevice();
        } else if (connector.defaultUrls) {
            connector.setVideoUrl(connector.defaultUrls.video_url);
            connector.setPosterUrl(connector.defaultUrls.poster_url);
    
            // Instantiate Video.JS player
            connector.createVideoPlayerInstance({data:{}});
        } else {
            document.getElementById(connector.videoPlayerId).innerHTML = 'No video hash has been given';
            document.getElementById(connector.videoPlayerId).style = 'text-align: center;background:#000;color:#fff;font-weight:900;height:200px;line-height:200px;'
        }
    } else {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://api.storyteq.com/v4/open/media/' + connector.videoHash);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-Content-Type-Options', 'nosniff');
    
        xhr.onload = function(data) {
            var response = JSON.parse(xhr.response);
    
            // Process response
            connector.setVideoUrl(response.data.urls.video);
            connector.setPosterUrl(response.data.urls);
            connector.setParameterData(response.data.parameters);
    
            // Instantiate JW player
            connector.createVideoPlayerInstance(response);
            
            // Create device event
            connector.createAnalyticDevice();
    
            if (connector.dataCallbackFunction) {
                // Run data callback function
                eval('window.' + connector.dataCallbackFunction + '()');
            }
        }
    
        xhr.send();
    }
}

StoryteqVideoPlayer.prototype.getBrowser = function () {
        var ua=navigator.userAgent,tem,M=ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []; 
        if(/trident/i.test(M[1])){
            tem=/\brv[ :]+(\d+)/g.exec(ua) || []; 
            return {name:'IE',version:(tem[1]||'')};
            }   
        if(M[1]==='Chrome'){
            tem=ua.match(/\bOPR|Edge\/(\d+)/)
            if(tem!=null)   {return {name:'Opera', version:tem[1]};}
            }   
        M=M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
        if((tem=ua.match(/version\/(\d+)/i))!=null) {M.splice(1,1,tem[1]);}
        return {
          name: M[0].toLowerCase(),
          version: M[1]
        };
}

StoryteqVideoPlayer.prototype.getOs = function () {
    var userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = 'other';
    
    if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'mac';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = platform;
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'windows';
    } else if (/Android/.test(userAgent)) {
        os = 'android';
    } else if (!os && /Linux/.test(platform)) {
        os = 'linux';
    }
    
    return {
        'name': os
    }
}

StoryteqVideoPlayer.prototype.getPlatform = function () {
    var connector = this;
    var os = connector.getOs(),
        mobilePlatforms = ['android', 'iPhone', 'iPad', 'iPod'],
        platform = 'desktop';

    if (mobilePlatforms.indexOf(os.name) !== -1) {
        platform = 'mobile';
    }
    
    return platform;
}

StoryteqVideoPlayer.prototype.createAnalyticDevice = function() {
    var connector = this;

    var meta = {
        'browser': connector.getBrowser(),
        'os': connector.getOs(),
        'platform' : connector.getPlatform(),
        'player' : 'videojs'
    };

    if (connector.verbose) {
        console.log(meta);
    }

    // Create analytic event
    this.analyticPostRequest('device', meta);
}

StoryteqVideoPlayer.prototype.createAnalyticView = function(percentage) {
    var connector = this;

    var meta = {
        'percentage': percentage
    };

    if (connector.verbose) {
        console.log(meta);
    }
    
    // Create analytic event
    connector.analyticPostRequest('view', meta);
}

StoryteqVideoPlayer.prototype.createAnalyticEmbed = function() {
    var connector = this;

    // Create analytic event
    connector.analyticPostRequest('embed', null);
}

StoryteqVideoPlayer.prototype.getParameterValueByName = function(parameterName) {
    for (var i = 0; i < this.parameterData.length; i++) {
        if (this.parameterData[i].name == parameterName) {
            return this.parameterData[i].value;
        }
    }
}

StoryteqVideoPlayer.prototype.getUrlParameter = function(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

StoryteqVideoPlayer.prototype.setVideoUrl = function(videoUrl) {
    var connector = this;
    if (!connector.videoUrl || connector.videoUrl === '') {
        this.videoUrl = videoUrl;
    }
}

StoryteqVideoPlayer.prototype.setPosterUrl = function(urls) {
    var connector = this;
    if (!connector.posterUrl || connector.posterUrl === '') {
        if (urls.hasOwnProperty('gif')){
             this.posterUrl = urls.gif;
        } else if (urls.hasOwnProperty('image')){
             this.posterUrl = urls.image;
        }
    }
}

StoryteqVideoPlayer.prototype.getVideoUrl = function() {
    return this.videoUrl;
}

StoryteqVideoPlayer.prototype.getPosterUrl = function() {
    return this.posterUrl;
}

StoryteqVideoPlayer.prototype.setParameterData = function(parameterData) {
    this.parameterData = parameterData;
}

if (typeof module === "object" && module && typeof module.exports === "object") {
    // commonjs / browserify
    module.exports = StoryteqVideoPlayer;
} else if (typeof require != 'undefined') {
    // AMD
    define(StoryteqVideoPlayer);
} else {
    window.StoryteqVideoPlayer = StoryteqVideoPlayer;
}
