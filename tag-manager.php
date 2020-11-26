<html>
    <head>
        <!-- Google Tag Manager -->
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-M34K328');</script>
            <!-- End Google Tag Manager -->

        <script type="text/javascript" src="src/storyteq-video-player.js"></script>
    </head>
    <body>
        <!-- Google Tag Manager (noscript) -->
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-M34K328"
            height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
            <!-- End Google Tag Manager (noscript) -->

        <div id="player">Loading the player...</div>

        <script type="text/javascript">
            var videoPlayer = new StoryteqVideoPlayer({
                videoPlayerId : 'player',
                videoParameterName : 'key',
                googleTagManager: {
                    enable: true,
                    event: 'gtm.storyteq.custom_event',
                    eventLabel: 'myCustomLabel',
                    eventCategory: 'storyteqVideoPlayer',
                },
                defaultUrls: {
                    video_url: 'https://domain.com/fallback_video.mp4',
                    poster_url: 'https://domain.com/fallback_image.jpg',
                }
            });
        </script>
    </body>
</html>