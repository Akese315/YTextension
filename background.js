


var number = 0;
var downloadBool = false;
var currentTab;
var musique_url ="";
var video_url ="";
var previousURLMUSIC ="";
var previousURLVIDEO ="";
var mainPort;

function updateMessaging()
{    
    mainPort.onMessage.addListener(function(request) {
        if(request.message === "connected")
        {
            mainPort.postMessage({message:"urlMusic", url: musique_url});
            mainPort.postMessage({message: "urlVideo",url: video_url});
            previousURLVIDEO = "";
            previousURLMUSIC = "";
        }
    });
}


function select(url)
{   
    if(downloadBool)
    {
        return;
    }
    var index = url.indexOf("&range=");
    if(index <0)
    {
        return;
    }  
    var newurl = url.substring(0,index);
    if(url.match(new RegExp("audio")))
    {
       
        musique_url = newurl;
        if(mainPort !== undefined && previousURLMUSIC !== musique_url)
        {
            previousURLMUSIC = musique_url;
            mainPort.postMessage({message : "urlMusic", url: musique_url });
        }        
        return;
    }
    if(url.match(new RegExp("video")))
    {
        video_url = newurl;
        if(mainPort !== undefined && previousURLVIDEO !== video_url)
        {
            previousURLVIDEO = video_url;
            mainPort.postMessage({message : "urlVideo", url: video_url });
        }
        return;
    }
   
}

function launchListener()
{
    chrome.webRequest.onHeadersReceived.addListener(function(details){
    
        select(details.url);        
        number++;
    },
    {urls: ["https://*.googlevideo.com/*"]}
    );

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab)
    {   
        currentTab = tab;
        if (changeInfo.url)
         {
            downloadBool = false;            
         }
    });

    chrome.runtime.onConnect.addListener(function(port) {
        if(port.name === "loading stage")
        {
            mainPort = port;            
        }
        updateMessaging();
        mainPort.onDisconnect.addListener(function(port)
        {
            mainPort = undefined;
        });
    });
    
   
}


function main()
{
    launchListener();
  

}

main();




