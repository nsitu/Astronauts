// get a list of current astronauts from API endpoint
fetch('/astronauts/current')
  .then(response => response.json())
  .then( astronauts => {
    display(astronauts);
    let number = astronauts.length;
    document.getElementById("header").innerHTML +=
    '<p>Our systems indicate that <span>'+number+'</span> humans are now hurtling around earth in a <a target="_blank" href="https://www.youtube.com/watch?v=KaOC9danxNo">tin can</a>.</p>'
    //console.log(number);
  })
  .catch(error => console.log(error) );

// for each astronaut, fetch and display a photo from Wiki
const display =  async ( astronauts ) => {
  // search Wiki for articles matching "astronaut" + this name
  // see also: https://www.mediawiki.org/wiki/API:Search
  for (let astronaut of astronauts){

  let theTerms = encodeURIComponent(astronaut.name+' space');

 // by splitting the names into an array,
 // we can deal with each one separately
 // this is useful when looking for a matching filename.
  astronaut.names = astronaut.name.split(" ");

  // using await here so that they appear in order
  await fetch('https://en.wikipedia.org/w/api.php?origin=*'+
          '&action=query&list=search&utf8=&format=json&prop=info&inprop=url'+
          '&srsearch=' +  theTerms )
  .then( response => response.json() )
  .then( response => {

    let title = response.query.search[0].title;
    let pageId = response.query.search[0].pageid;
    astronaut.pageId = pageId;
    astronaut.title = title;
    return title; // return the title of the first article
  })
  .then( title => {
      // search for images inside this article
      //see also: https://www.mediawiki.org/wiki/API:Images
      // By default it takes the first 10
      // But many astronauts have more than 10 picutres
      // so the imlimit parameter is set to 100

      return fetch(
      'https://en.wikipedia.org/w/api.php?origin=*'+
      '&action=query&prop=images&imlimit=100&utf8=&format=json'+
      '&titles=' + encodeURIComponent(title)) })
  .then( response => { return response.json() })
  .then( response => {
    let id = Object.keys(response.query.pages)[0];
    let page = response.query.pages[id];
    let title = page.title;
    let candidates=[];
    // select the most suitable image
    // start by preferring jpg images over svg
    // as they are more likely to be photographs.
    for ( let img of page.images) {
      if (img.title.includes('.jpg') ){
        candidates.push(img)
      }
    }
    // among the jpg images,
    // prefer filenames that include the astronaut's name
    for (let img of candidates){
      for ( name of astronaut.names){
        if (img.title.includes(name) ){
          astronaut.imageTitle = img.title;
          console.log("Found a JPG matching '"+name+"' -- "+img.title+" ")
          return img.title
        }
      }
    }
    // if nothing else works, just return the first Jpeg
    let img = candidates[0]
    console.log("Defaulting to "+img.title+" - the first available JPEG.")
    astronaut.imageTitle = img.title;
    return img.title;

  })
  .then( imgTitle => {
    // Get image info (i.e. URL) using the image title
    // see also: https://www.mediawiki.org/wiki/API:Imageinfo
    let theWidth = 750; // scale image to fit
    return fetch(
    'https://en.wikipedia.org/w/api.php?origin=*'+
    '&action=query&prop=imageinfo&iiprop=url&iiurlwidth='+theWidth+'&utf8=&format=json'+
    '&titles=' + encodeURIComponent( imgTitle )) })
  .then(response => response.json() )
  .then(response => {
    let id = Object.keys(response.query.pages)[0];
    let info = response.query.pages[id];
    // console.log(info)
    if (typeof info.imageinfo != 'undefined'){
      // url for thumbnail image:
      astronaut.thumb = info.imageinfo[0].thumburl;
      // url for full resolution image (not being used)
      astronaut.url = info.imageinfo[0].url;
    }
    else{
      astronaut.thumb = "astronaut.svg"
      astronaut.url = "astronaut.svg"
    }

    document.getElementById("astros").innerHTML  +=
      '<div class="container">'+
        '<div class="avatar" '+
          'style="background-image: url('+astronaut.thumb+');">'+
        '</div>'+
        '<div class="content">' +
          '<h2>'+
            '<a href="http://en.wikipedia.org/?curid='+astronaut.pageId+'">'+
              astronaut.name+
            '</a>'+
          '</h2>'+

            '<a href="http://en.wikipedia.org/?curid='+astronaut.pageId+'">'+
              astronaut.title+
            '</a>'+
          '<p>'+astronaut.craft+'</p>'+
        '</div>'+
      '</div>';
  });
}



}
