const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({
  log: true,
  corePath: chrome.runtime.getURL('vendor/ffmpeg-core.js'),
});

var radio_Music;
var port;
var alreadyLoaded = false;
var clickBool = false;
var btndown;
var bytes;
var MusicUrl = "";
var VideoUrl = "";
var pourcent = "";
let bytesDownloaded = 0;

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

$( document ).ready(async function()
{   
    await ffmpeg.load();
    radio_Music = document.getElementById("Music_radio");
    loader = document.getElementById("loader");
    FileName_field = document.getElementById("file_name");
    btndown = document.getElementById("download");
    pourcent = document.getElementById("pourcent");
    port = chrome.runtime.connect({name : "loading stage"});    
    console.log("connected")
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
      console.log(request);
      if (request.message === "urlMusic")
        {             
          MusicUrl = request.url;
        }   
      if(request.message === "urlVideo")   
        {
         
          VideoUrl = request.url;
        }                
      });

      port.postMessage({"message": "connected"});
     
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
  fetch(MusicRequest).then(response => download(response)).then(file => getFile(file,name));
}

async function download(response)
{
  console.log("start downloading...")
  var chunks = [];
  console.log(response.headers);
  var fileLength = response.headers.get('content-length');
  console.log(fileLength);
  var currentLength = 0;
  const reader = response.body.getReader()
  while(true){
    const { done, value } = await reader.read();
    if(done){
      break;
    }
    currentLength += value.length;
    pourcent.textContent = (Math.round(currentLength*100/fileLength)) + "%";
    chunks.push(value);
  }
  return new Blob(chunks,{type :"audio/mp3"});
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


