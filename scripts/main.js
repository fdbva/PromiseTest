/*eslint-env browser */
/*eslint no-var: "error"*/
/*eslint prefer-const: "error"*/
/*eslint-env es6*/

  const inputTB = document.querySelector("#testInput");
  const button = document.querySelector("#testButton");
  const name = "a";

  button.addEventListener("click", function(){
      const parsedInput = parseUserInput(inputTB.value, supportedSites);
      const yqlStringLinks = yqlStringBuilder(parsedInput.href, parsedInput.xpathLinks);
      
      makeRequest('GET', yqlStringLinks)
      .then(function(data) {  
            console.log('Request ongoing - getting story');
            const numberOfChapters = (JSON.parse(data)).query.results.select[0].option.length;
            console.log(`Story has ${numberOfChapters} chapters`);
            

            console.log('TODO: loop to get all chapter contents.');
            //build a list of chapters, and make a yqlStringBuilderALL and makeRequestAll?
            //button.insertAdjacentHTML("afterend", "<div>"+ syntaxHighlight(printTest) +"</div>");
        }).catch(function(error) {  
            console.log('Request failed', error);  
        });
      
  })
  const supportedSites = new Map([
      ["www.fanfiction.net", 
        { xpathLinks: '//*[@id="chap_select"]',
            xpathStory: '//*[@id="storytext"]'}],
      ["m.fanfiction.net", 
        { xpathLinks: '//*[@id="jump"]',
            xpathStory: '//*[@id="storytext"]'}],
      ["www.fictionpress.com", 
        { xpathLinks: '//*[@id="chap_select"]',
            xpath: '//*[@id="storytext"]',
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
      const input = parseUrl(url);
      if(supSites.has(input.hostname)){
          input.xpathLinks = supSites.get(input.hostname).xpathLinks;
          input.xpathStory = supSites.get(input.hostname).xpathStory;
          console.log(`Site ${input.name} successfully detected`);
          console.log(JSON.stringify(input, undefined, 2));
          return input;
      }
      else{
          console.log(`I'm sorry, '${inputTB.value}' not found in our supported sites list`);
      }
  }
  function yqlStringBuilder(parsedUrl, xpath){
      if(!parsedUrl || !xpath){
          console.log(`yqlStringBuilder input problem:
                       parsedUrl: ${parsedUrl}
                       xpath: ${xpath}`);
          return;
      }
      const yqlQuery = `select * from html where url='${parsedUrl}' and xpath='${xpath}'`;
      const encodedYqlQuery = encodeURIComponent(yqlQuery);
      const yqlQueryString = `https://query.yahooapis.com/v1/public/yql?q=${encodedYqlQuery}&format=json`;
      const yql = 'http://query.yahooapis.com/v1/public/yql?'
        + 'q=' + encodeURIComponent(`select * from html where url=@url and xpath='${xpath}'`)
        + '&url=' + encodeURIComponent(parsedUrl)
        + '&crossProduct=optimized&format=json';
      
      if(yql){
          console.log(`yqlStringBuilder worked successfully 
    href: ${parsedUrl}
    xpath: ${xpath}`);
          return yql;
      }
      else{
          console.log('something went wrong while building yqlString:');
          console.log(`yqlQueryString: ${yql}
                       yqlQuery: ${yqlQuery}`);
      }
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
    nameArr = a.host.split('.')
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
      name: nameArr[0] == 'www' || nameArr[0] == 'm' ? nameArr[1] : nameArr[0]
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