/*eslint-env browser */
/*eslint no-var: "error"*/
/*eslint prefer-const: "error"*/
/*eslint-env es6*/

  const inputTB = document.querySelector("#testInput");
  const button = document.querySelector("#testButton");
  const resultsAnchor = document.querySelector('#resultsAnchor');
  const name = "a";
  button.addEventListener("click", function(){
      const parsedInput = parseUserInput(inputTB.value, supportedSites);
      const yqlStringLinks = yqlStringBuilder(parsedInput.href, parsedInput.xpathLinks);
      const yqlStringChapters = new Set();
      makeRequest('GET', yqlStringLinks)
      .then(function(data) {  
            console.log('Request ongoing - getting story');
            const numberOfChapters = (JSON.parse(data)).query.results.select[0].option.length;
            console.log(`Story has ${numberOfChapters} chapters`);
            for(i=1;i<=3;i++){
              //yqlStringChapters.add(yqlStringBuilder(parsedInput.hrefEmptyChapter+i, parsedInput.xpathStory, 'xml'));
              makeRequest('GET', yqlStringBuilder(parsedInput.hrefEmptyChapter+i, parsedInput.xpathStory, 'xml'))
              .then(function(data) {
                resultsAnchor.insertAdjacentHTML('beforeend', `<div class="chapterBox">${data}</div>`);
              }).catch(function(){
                console.log('Request failed', error);  
              });
            }
            //console.log('TODO: loop to get all chapter contents.');
            //build a list of chapters, and make a yqlStringBuilderALL and makeRequestAll?
            //button.insertAdjacentHTML("afterend", "<div>"+ syntaxHighlight(printTest) +"</div>");
        }).catch(function(error) {  
            console.log('Request failed', error);  
        });
      
  });
  const supportedSites = new Map([
      ["www.fanfiction.net", 
        { xpathLinks: '//*[@id="chap_select"]',
            xpathStory: '//*[@id="storytext"]'}],
      ["m.fanfiction.net", 
        { xpathLinks: '//*[@id="jump"]',
            xpathStory: '//*[@id="storytext"]'}],
      ["www.fictionpress.com", 
        { xpathLinks: '//*[@id="chap_select"]',
            xpathStory: '//*[@id="storytext"]',
            jsonNChapters: '.query.results.select[0].option.length'}],
      ["m.fictionpress.com", 
        { xpathLinks: '//*[@id="d_menu"]/div/form',
            xpathStory: '//*[@id="storytext"]'}],   
  ]);
  /*function status(response) {  
    if (response.status >= 200 && response.status < 300) {  
        return Promise.resolve(response)  
    } else {  
        return Promise.reject(new Error(response.statusText))  
    }  
  }*/
  function parseUserInput(url, supSites){
    if(!url){
      console.log(`Couldn't find url to be parsed`);
      return;
    }
      const input = parseUrl(url);
      if(!supSites.has(input.hostname)){
        console.log(`I'm sorry, '${inputTB.value}' not found in our supported sites list`);
        return;
      }
      input.xpathLinks = supSites.get(input.hostname).xpathLinks;
      input.xpathStory = supSites.get(input.hostname).xpathStory;
      if(!input.xpathLinks || !input.xpathStory){
        console.log(`parseUserInput input problem:
                    xpathLinks: ${input.xpathLinks}
                    xpathStory: ${input.xpathStory}`);
        return;
      }
      console.log(`Site ${input.name} successfully detected`);
      console.log(JSON.stringify(input, undefined, 2));
      return input;
  }
  function yqlStringBuilder(parsedUrl, xpath, format='json'){
      if(!parsedUrl || !xpath){
          console.log(`yqlStringBuilder input problem:
                       parsedUrl: ${parsedUrl}
                       xpath: ${xpath}`);
          return;
      }
      const yql = 'https://query.yahooapis.com/v1/public/yql?'
        + 'q=' + encodeURIComponent(`select * from html where url=@url and xpath='${xpath}'`)
        + '&url=' + encodeURIComponent(parsedUrl)
        + `&crossProduct=optimized&format=${format}`;
      
      if(!yql){
          console.log('something went wrong while building yqlString:');
          console.log(`yqlQueryString: ${yql}
                       yqlQuery: ${yqlQuery}`);
      }
      return yql;
  }
  
function makeRequest (method, url) {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    console.log(`making request with url: ${url}`);
    xhr.open(method, url);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}  

const parseUrl = (function () {
  const a = document.createElement('a');
  return function (url) {
    a.href = url;
    hostArrDot = a.host.split('.');
    hrefArrSlash = a.href.split('/');
    if(!hostArrDot[0] || !hostArrDot[1]){
      console.log(`There's a problem in the story link`);
    }
    if(!hrefArrSlash[4]){
      console.log(`Story ID could not be parsed from link`);
    }
    return {
      origin: a.origin,
      host: a.host,
      href: a.href,
      hostname: a.hostname,
      pathname: a.pathname,
      port: a.port,
      protocol: a.protocol,
      search: a.search,
      hash: a.hash,
      xpathLinks: '',
      xpathStory: '',
      name: hostArrDot[0] == 'www' || hostArrDot[0] == 'm' ? hostArrDot[1] : hostArrDot[0],
      hrefEmptyChapter: a.origin + `/s/${hrefArrSlash[4]}/` 
    };
  }
})();

//only used for developing
function syntaxHighlight(json) {
    if (typeof json != 'string') {
         json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}