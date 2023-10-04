var radio_Music;
var port;
var alreadyLoaded = false;
var clickBool = false;
var btndown;
var bytes;
var MusicUrl = "";
var VideoUrl = "";
let bytesDownloaded = 0;
let AudioFileLength = 0;
let VideoFileLength = 0;

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
          AudioFileLength = 0;
          VideoFileLength = 0;
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

async function downloadVideo(name)
{
  loading();
  if(MusicUrl.length == 0 ||VideoUrl.length == 0)
  {
    return;
  }

  AudioFileLength = getContentLength(MusicUrl);
  VideoFileLength = getContentLength(VideoUrl);


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
      
  const audioFile = await fetch(MusicRequest).then(response => download(response));
  const videoFile = await fetch(VideoRequest).then(response =>download(response));

  getFile(outputData);
}

function addPercent(bytes,ETA)
{
  var fullLength = AudioFileLength + VideoFileLength;
  bytesDownloaded += bytes;
  pourcent.textContent = Math.floor(bytesDownloaded/fullLength*100)  + "% ETA : "+Math.floor(ETA)+"s";
}

async function getContentLength(url)
{
    const response = await fetch(url, { method: "HEAD" });
    const contentLength = response.headers.get("content-length");
    console.log(`La taille du fichier est de ${contentLength} octets.`);
    console.log(typeof (contentLength))
    return Number(contentLength);
}

async function downloadMusic(name)
{
  loading();
  if(MusicUrl.length == 0)
  {
    return;
  }
  AudioFileLength = await getContentLength(MusicUrl);

  var MusicRequest = new Request(MusicUrl,
      {
          method: 'POST',
          headers: {
              'Content-Type' : 'blob',
              'Origin':'https://www.youtube.com',
              'Accept':'*/*',
              'Accept-Encoding':'gzip, deflate, br', 
              'Accept-Language':  'fr-FR,fr;q=0.9,en-GB;q=0.8,en;q=0.7,en-US;q=0.6,es;q=0.5',
              'referer':'Referer',
              'Sec-Ch-Ua':'"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
              'Sec-Fetch-Mode': 'cors'
          }
      });
  const audioFile = await fetch(MusicRequest).then(response => download(response));
  getFile(audioFile, name);
}

async function download(response)
{
  console.log("start downloading...")
  var chunks = [];
  console.log(response.headers);
  var fileLength = response.headers.get('content-length');
  console.log(fileLength);
  const reader = response.body.getReader()

  var timebefore = 0;
  var timeafter = 0;
  const starttime = Date.now();
  let ETA =0
  let sec = 0;
  while(true){
    timebefore = Date.now();
    const { done, value } = await reader.read();
    timeafter = Date.now();
    let timeEllapsed = timeafter - timebefore;
    sec += timeEllapsed
    if(sec > 1000)
    {
      ETA = ((((fileLength/value.length)*timeEllapsed)-(timeafter-starttime))/1000);
      sec -= 1000;
    }
    if(done){
      break;
    }
    addPercent(value.length,ETA);
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


