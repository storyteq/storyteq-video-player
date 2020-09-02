
# storyteq-video-player
A VideoJS based player connected with Storyteq API to simplify the loading of video data and tracking video analytics. The player uses the unique hash generated by Storyteq API when creating a video as a reference to load video data and generate analytics. 

The analytics are visible in the Storyteq platform CRM Analytics. Please [contact us](mailto:teq@storyteq.com) if you haven't received a login yet.

## Dependencies
Loading the player into your page is fairly easy, you can include the script directly from our CDN. Make sure to include the  script in the head of your page like this:
```
<script type="text/javascript" src="https://storage.googleapis.com/storyteq-video-player/dist/storyteq-video-player.min.js"></script>
```
## Usage
After loading the script into your page, the player needs to be configured. This is done by defining values for a few parameters in the following fashion:

```
var videoPlayer = new StoryteqVideoPlayer({
	videoPlayerId : 'player',
	videoParameterName : 'key'
});
``` 
Not all parameters are required. Please check out the table below for the full specs of the player.

|parameter|type|description|required|
|--|--|--|--|
|videoPlayerId|string|The id of the HTML-element where the video player should be loaded.|yes|
|videoHash|string|The hash used to directly retrieve the video and send analytics events to.|not required if videoParameterName or mediaData is filled|
|videoParameterName|string|The name of the query parameter in the current page URL that contains the video hash. For example if your landing page is `https://example.com/landing-page?key=d41d8cd98f00b204e9800998ecf8427e`, you need to provide `key` as a value.|not required if videoHash or mediaData is filled|
|mediaData|json|The full media data if already previously obtained from the API.|not required if videoHash or videoParameterName is filled|
|dataCallbackFunction|string|The name of the function which is called after video data has been loaded from the Storyteq API. This video data can for example be used for greeting the visitor with a personal message or prefilling a form. Video data parameter keys are similar to your template parameter keys. Check the dataCallbackFunction in example.html for a working example|no|
|verbose|bool|Enable console logging for the player.|no|
|defaultUrls|object|Define fallback URL's for when no hash is provided in the URL.|no|
|posterUrl|string|Define a poster url to override the personalised poster|no|
|noPoster|boolean|Allow the player to not load the poster|no|
|events|object|Define custom eventhandlers for the player by passing a key-value pair object with the event as key and the handler as the value, such as: `events: { play: () => {}}`|no|

## Example
Example of a page that will play the video with the hash passed in the `key` query parameter: https://example.com/landing?key=d41d8cd98f00b204e9800998ecf8427e
```
<!doctype html>

<html>

<body>
    <div id="parent">
        <div id="player"></div>
    </div>

    <script type="text/javascript" src="https://storage.googleapis.com/storyteq-video-player/dist/storyteq-video-player.min.js"></script>
    <script>
        var videoPlayer = new StoryteqVideoPlayer({
            videoPlayerId: 'player',
            videoParameterName: 'key'
        });
    </script>
</body>

</html>
```
## Testing
If everything is set up correctly, you can test the player. To create a valid URL, attach the videoParameterName as a GET parameter to your base URL, then add the video's unique hash as a value. For example:
```
https://example.com?key=9e0627ae3c707b451c9ac8e1408563a1
```
When you visit your page, the generated video should automatically be loaded.

NOTE: The hash in the example is not functional and cannot be used for testing. Please use the hash of one of the videos created in your own Storyteq account.
## Support
If you run into trouble using the player, please [contact us](mailto:teq@storyteq.com).
