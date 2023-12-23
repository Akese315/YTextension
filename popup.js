var lastTimeUpdated = 0;
var bytesDownloaded = 0;
var audioURL = "";
var videoURL = "";
const DEFAULT_RANGE = 500000;
const TIME_BTWEEN_REQ = 200;
var startedAt = 0;
var clickBool = false;

function loading()
{  
  if(!clickBool)
    {
      btndown.className= "load";
      setTimeout(()=>
        {
          btndown.style.display = "none";
          loader.style.display ="block";
          loader.className = "sleep";                
        },1000);  
      clickBool = true;               
    }     
}

function sleep()
{
  loader.className = "load";
  setTimeout(()=>
    {
      loader.style.display ="none";
      btndown.style.display ="block";
      btndown.className= "sleep";
      clickBool = false;
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
      //console.log(request);
      if (request.message === "urlMusic")
        {             
          audioURL = request.url;
        }   
      if(request.message === "urlVideo")   
        {
         
          videoURL = request.url;
        }                
      });

      port.postMessage({"message": "connected"});
     
});

async function getContentLength(url)
{
    const response = await fetch(url, { method: "HEAD" });
    const contentLength = response.headers.get("content-length");
    console.log(`La taille du fichier est de ${contentLength} octets.`);
    return parseInt(contentLength);
}

async function downloadMusic(filename)
{
  loading();
  bytesDownloaded =0;
  const url = audioURL;
  const fileLength = await getContentLength(url)
  const intervalID =  setInterval(()=>
  {
      updateCompletion(fileLength)
  },500)
  const startedAt = Date.now();
  const data = await startDownloading(url,fileLength)
  console.log("Le téléchargement est terminé, téléchargement total : "+bytesDownloaded.toString())
  console.log("time ellapsed : " +((Date.now()-startedAt)/1000).toString()+"seconde")
  console.log(((fileLength/1000000)/((Date.now()-startedAt)/1000)).toString()+" MB/s")
  clearInterval(intervalID);
  const orderedData = mergeChunks(data)
  const file = new Blob(orderedData,{type :"audio/mp3"})
  writeFile(file, filename+".mp3")
  sleep()
}

async function downloadVideo(filename)
{
  const videoUrl = videoURL;
  const soundURL = audioURL;
  const audioFileLength = await getContentLength(soundURL)
  const videoFileLength = await getContentLength(videoUrl)
  const intervalID =  setInterval(()=>
  {
      updateCompletion(videoFileLength+audioFileLength)
  },500)
  const startedAt = Date.now();
  const dataVideo = await startDownloading(videoUrl,videoFileLength)
  const dataSound = await startDownloading(soundURL,audioFileLength)  
  console.log("download is over")
  console.log("time ellapsed : " +((Date.now()-startedAt)/1000).toString()+"seconde")
  console.log((((videoFileLength+audioFileLength)/1000000)/((Date.now()-startedAt)/1000)).toString()+" MB/s")
  clearInterval(intervalID);
  const orderedVideo = mergeChunks(dataVideo)
  const orderedAudio = mergeChunks(dataSound)
  const file = new Blob([orderedVideo,orderedAudio],{type :"video/mp4"})
  writeFile(file, filename+".mp4")
  sleep()
}

async function startDownloading(url,fileLength)
{
  return new Promise(async (resolve, reject)=>
  {
    try
    {
      var chunkID = 0
      var chunkMap = new Map();
      const requestMap = createRequestMap(url,10000,fileLength)
      console.log(requestMap)
      const shuffledMap = shuffleMap(requestMap)
      const recursiveFunction =async(id)=>
      {
        if(i >= requestMap.size)return;
        downloadPart(shuffledMap.get(id),id).then(value=>
        {
          chunkID +=1
          chunkMap.set(value.index, value.data); 
          
          if(chunkID < requestMap.size)
          {
            var randomTime = Math.floor(Math.random()* 100 + TIME_BTWEEN_REQ)
            delay(randomTime)
            recursiveFunction(chunkID);
          }
          if(chunkMap.size == requestMap.size)
          {
            
            resolve(chunkMap)
          } 
        });
      } 
      
      for(var i = 0;i<5; i++)
      {
        recursiveFunction(i)
      }


    }catch (error)
    {
      return reject(error)
    }
  })
}

function shuffleMap(map) {
  const entries = Array.from(map.entries());

  for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [entries[i], entries[j]] = [entries[j], entries[i]];
  }

  // Reconstruire la carte à partir du tableau mélangé
  const shuffledMap = new Map(entries);
  return shuffledMap;
}

function createRequestMap(url, range, filesize)
{
  var requestMap = new Map();
  var lastRandomRange = -1
  var index = 0;
  while(lastRandomRange < filesize)
  {
    var randomRange = Math.floor(Math.random()* range+lastRandomRange + DEFAULT_RANGE)

    if(randomRange >= filesize)
    {
      randomRange = filesize
    }
    parturl = url+ "&range="+(lastRandomRange + 1).toString() + "-"+(randomRange).toString()
    console.log((lastRandomRange + 1).toString() + "-"+(randomRange).toString())
    lastRandomRange = randomRange
    requestMap.set(index,parturl)
    index +=1;
  }
  return requestMap
}

async function downloadPart(url, index)
{
    console.log(url)
    return new Promise(async (resolve, reject) => {
        try {
            const part =new Request(url,
            {
                method: 'POST',
                headers: {
                    'content-Type' : 'blob'
                }
            });
            const response = await fetch(part)
            downloading(response).then(value =>
            {
                resolve({data :value,index : index})
            })
        }catch(error)
        {
            reject(error)
        }
    });
}

function delay(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
}

async function downloading(response) {
    return new Promise(async (resolve, reject) => {
      try {
        var chunks = [];
        const reader = response.body.getReader();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          bytesDownloaded += value.length;
          //console.log(bytesDownloaded)
          chunks.push(value);
        }
  
        resolve(chunks);
      } catch (error) {
        reject(error);
      }
    });
  }

function mergeChunks(chunks, fileLength)
{
    let tableauDeMap = Array.from(chunks);
    tableauDeMap.sort((a, b) => a[0] - b[0]);
    let orderedMap = Array.from(new Map(tableauDeMap).values())
    flattenedArray = orderedMap.flat();
    return flattenedArray;
}

function writeFile(file,name)
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
}

async function updateCompletion(fileLength)
{   
    pourcent.textContent = Math.ceil(bytesDownloaded/fileLength*100)+"%"
}

async function getByteRate(value)
{
    
} 

