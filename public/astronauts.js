// get a list of current astronauts from API endpoint
fetch('/astronauts/current')
  .then(response => response.json())
  .then( async astronauts => {
    // Wait for all the astronauts to render
    // See also: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
    // See also: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
    await Promise.all( astronauts.map( render ) )
    // After rendering is finished, add astronaut profiles to the page
    astronauts.forEach( astronaut => {
      document.getElementById("astros").innerHTML += astronaut.profile 
    })
    // add header showing the total number of astronauts
    document.getElementById("header").innerHTML +=
      '<p>'+
        'Systems show <span>' + astronauts.length + '</span> '+
        'humans hurtling around earth in a '+
        '<a target="_blank" href="https://www.youtube.com/watch?v=KaOC9danxNo">'+
          'tin can'+
        '</a>.'+
      '</p>'

  })
  .catch(error => console.log(error) );

// To Render an astronaut:
// 1. Find a Wikipedia article matching astronaut name
// 2. Gather all images from the above article
// 3. Select suitable JPG - prefer filenames containing astronaut name
// 4. Get the URL for the selected image.
// 5. Assemble a template from the parts. 

const render =  async ( astronaut ) => {

  // 1. Find a Wikipedia article matching astronaut name
  // =============
  // see also: https://www.mediawiki.org/wiki/API:Search
  
  let theSearchTerms = encodeURIComponent(astronaut.name+' space');

  await fetch('https://en.wikipedia.org/w/api.php?origin=*'+
        '&action=query'+
        '&list=search'+
        '&format=json'+
        '&prop=info'+
        '&inprop=url'+
        '&srsearch=' +  theSearchTerms )
  .then( response => response.json() )
  .then( response => {
    
    // record pertinent details from the response.
    astronaut.pageId = response.query.search[0].pageid;
    astronaut.title = response.query.search[0].title;
    astronaut.snippet = response.query.search[0].snippet;
    
    // we'll need the title in the next step to find corresponding images 
    return astronaut.title; 
  })
  .then( title => {

      // 2. Gather all images from the article
      // =============
      // see also: https://www.mediawiki.org/wiki/API:Images
      // Wiki returns the first 10 images dy default.
      // Some astronauts have more than 10, so we'll increase the limit to 100

      return fetch(
      'https://en.wikipedia.org/w/api.php?origin=*'+
      '&action=query&prop=images&imlimit=100&utf8=&format=json'+
      '&titles=' + encodeURIComponent(title)) })
  .then( response => response.json() )
  .then( response => {
    let id = Object.keys(response.query.pages)[0];
    let page = response.query.pages[id];
    

    // 3. Select suitable JPG - prefer filenames containing astronaut name
    // =============

    // suitable images will be added to this array
    let candidates=[];

    // start by filtering out non-JPG images.
    // e.g. SVG and PNG files are usually graphics rather than photos
    for ( let img of page.images) {
      if (img.title.includes('.jpg') ){
        candidates.push(img)
      }
    }

    // Split astronaut's full name into an array of first,middle,last
    // Check each sub-name to see if it matches the JPG filename
    astronaut.names = astronaut.name.split(" ");
    for (let img of candidates){
      for ( name of astronaut.names){
        if (img.title.includes(name) ){
          astronaut.imageTitle = img.title;
          console.log("Found a JPG matching '"+name+"' -- "+img.title+" ")
          return img.title
        }
      }
    }
    // if nothing else works, default to the first JPG
    let img = candidates[0]
    console.log("Defaulting to "+img.title+" - the first available JPEG.")
    astronaut.imageTitle = img.title;
    return img.title;

  })
  .then( imgTitle => {

    // 4. Get the URL and credits for the selected image.
    // =========

    // Get image info (i.e. URL) using the image title
    // see also: https://www.mediawiki.org/wiki/API:Imageinfo

    //https://en.wikipedia.org/w/api.php?action=query&format=json&prop=imageinfo&titles=File%3ABilly_Tipton.jpg&iilimit=1

    let theWidth = 750; // scale image to fit
    return fetch(
    'https://en.wikipedia.org/w/api.php?origin=*'+
      '&action=query'+
      '&prop=imageinfo'+
      '&iiprop=url|user'+
      '&iiurlwidth='+theWidth+
      '&utf8=&format=json'+
      '&titles=' + encodeURIComponent( imgTitle )) })
  .then(response => response.json() )
  .then(response => {
    let id = Object.keys(response.query.pages)[0];
    let info = response.query.pages[id];
    // console.log(info)
    if (typeof info.imageinfo != 'undefined'){
      astronaut.imageCredit = info.imageinfo[0].user
      astronaut.imageDescriptionURL = info.imageinfo[0].descriptionurl
      // url for thumbnail image:
      astronaut.imageThumb = info.imageinfo[0].thumburl;
      // url for full resolution image (not being used)
      astronaut.imageURL = info.imageinfo[0].url;
    }
    else{
      astronaut.imageThumb = "astronaut.svg"
      astronaut.imageURL = "astronaut.svg"
    }

    // 5. Assemble a template from the parts. 
    // =======
    astronaut.profile = '<div class="container">'+
      '<div class="avatar" '+
        'style="background-image: url('+astronaut.imageThumb+');">'+
      '</div>'+
      '<div class="content">' +
        '<h2>'+
          '<a href="http://en.wikipedia.org/?curid='+astronaut.pageId+'">'+
            astronaut.name+
          '</a>'+
        '</h2>'+
        '<p class="snippet">'+astronaut.snippet+'</p>'+
        '<p class="wikiArticle">'+
          '<a class="wikiLink" href="http://en.wikipedia.org/?curid='+astronaut.pageId+'">'+
              astronaut.title+
          '</a>'+
        '</p>'+
        '<p class="photoCredit">'+
          'Photo: <a href="'+astronaut.imageDescriptionURL+'">'+astronaut.imageCredit+'</a>'+
        '</p>'+
      '</div>'+
    '</div>'
  })
}
