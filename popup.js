var radio_Music;
var port;
var alreadyLoaded = false;
var clickBool = false;
var btndown;
var bytes;
var MusicUrl = "";
var VideoUrl = "";

function loading()
{  
  if(!alreadyLoaded)
    {
      btndown.className= "load";
      setTimeout(function()
        {
          btndown.style.display = "none";
          loader.style.display ="block";
          loader.className = "sleep";                
        },1000);  
      alreadyLoaded = true;
      clickBool = true;               
    }     
}

function sleep()
{
  loader.className = "load";
  setTimeout(function()
    {
      loader.style.display ="none";
      btndown.style.display ="block";
      btndown.className= "sleep";
      clickBool = false;
      alreadyLoaded = false;
    },1000);
}

$( document ).ready(function()
{    
    radio_Music = document.getElementById("Music_radio");
    loader = document.getElementById("loader");
    FileName_field = document.getElementById("file_name");
    btndown = document.getElementById("download");
    port = chrome.runtime.connect({name : "loading stage"});    
    port.postMessage({"message": "connected"});
    
    btndown.addEventListener('click',function()
    {
      Music_radio = radio_Music.checked;
        if(!clickBool)
        {
          if(Music_radio == true)
          {
              downloadMusic(FileName_field.value);
          }
          if(Music_radio == false)
          {
              
            downloadVideo(FileName_field.value);
          }        
           
        }        
    });    
    
    port.onMessage.addListener(function(request) {
      if (request.message === "urlMusic")
        {             
          MusicUrl = request.url;
        }   
      if(request.message === "urlVideo")   
        {
          VideoUrl = request.url;
        }                
      });
     
});

function downloadVideo(name)
{
  loading();
  var musicData;
  var videoData; 
  if(MusicUrl.length == 0 ||VideoUrl.length == 0)
  {
    return;
  }
  var MusicRequest = new Request(MusicUrl,
      {
          method: 'POST',
          headers: {
              'content-Type' : 'blob'
          }
      });
  var VideoRequest = new Request(VideoUrl,
      {
          method: 'POST',
          headers: {
              'content-Type' : 'blob'
          }
      });  
      
      fetch(MusicRequest)
          .then(response => response.blob())
          .then(data=> {
            musicData = data;          
          })
          .then(function()
            {
              fetch(VideoRequest)
              .then(response=> response.blob())
              .then(data=> {
                videoData = data;                  
                })
              .then(function()
              {
                var globalData = new Blob([videoData,musicData],{type :"video/mp4"});
                getFile(globalData, name);
              })      
            });
    
}

function downloadMusic(name)
{
  loading();
  if(MusicUrl.length == 0)
  {
    return;
  }
  var MusicRequest = new Request(MusicUrl,
      {
          method: 'POST',
          headers: {
              'content-Type' : 'blob'
          }
      });
      fetch(MusicRequest)
          .then(response => response.blob())
          .then(data=> {   
            var globalData = new Blob([data],{type : "audio/mp3"});      
            getFile(globalData, name);
          });
}

function getFile(file, name)
{               
        var href = window.URL.createObjectURL(file);
        var link = document.createElement("a");
        link.href = href;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        setTimeout(function()
        {
            URL.revokeObjectURL(href);
            document.body.removeChild(link);            
        }, 0); 
        sleep()
}


