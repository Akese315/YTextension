
var number = 0;
var downloadBool = false;
var currentTab;
var musique_url ="";
var video_url ="";
var mainPort;

function   updateMessaging()
{    
    mainPort.onMessage.addListener(function(request) {
        if(request.message === "connected")
        {
            console.log("sent :" + video_url);
            console.log("sent :" + musique_url);
            mainPort.postMessage({message:"urlMusic", url: musique_url});
            mainPort.postMessage({message: "urlVideo",url: video_url});
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
        console.log("audio");
        if(newurl !== musique_url)
        {
            musique_url = newurl;
            console.log(musique_url);
        }
        else
        {
            return;
        }
        if(mainPort !== undefined)
        {
            mainPort.postMessage({message : "urlMusic", url: musique_url });
        }        
        return;
    }
    if(url.match(new RegExp("video")))
    {
        console.log("video");
        if( newurl !== video_url)
        {
            video_url = newurl;
            console.log(video_url);
        }else
        {
            return;
        }
        if(mainPort !== undefined)
        {
            mainPort.postMessage({message : "urlVideo", url: video_url });
        }
        return;
    }
    console.log("matched nothing")
   
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
    console.log("started")
    launchListener();
}

main();




