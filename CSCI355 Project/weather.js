const fs = require("fs");
const url = require("url");
const http = require("http");
const https = require("https");
const credentials = require("./auth/credentials.json");

const port = 3000;
const server = http.createServer();
server.on("request", request_handler);
function request_handler(req, res){
    console.log(`New Request for ${req.url} from ${req.socket.remoteAddress}`);
    if(req.url === "/"){
        res.writeHead(200, {"Content-Type": "text/html"});
        const html_stream = fs.createReadStream("html/form.html");
        html_stream.pipe(res);
    }
    else if (req.url.startsWith("/images/lighting.jpg"))
	{
		res.writeHead(200, {"Content-Type": "text.html"});
		const html_stream = fs.createReadStream("images/lighting.jpg")
        html_stream.pipe(res);
    }
    
    else if (req.url.startsWith("/search")){
        res.writeHead(200, {"Content-Type": "text/html"});
        const location = url.parse(req.url, true).query;
        
        get_weather_information(location.city, res);   
    } 
    
    else {
		console.log("fail");
        res.writeHead(404, "Not Found", {"Content-Type": "text/html"});
        res.write(`<h1>404 Not Found</h1>`);
        res.end();
    }  
    
    function get_weather_information(city, res){
        
        
        const weather_endpoint = `http://api.openweathermap.org/data/2.5/find?q=${city}&units=imperial&appid=${credentials.appid}`;
        http.request(weather_endpoint, {method:"GET", headers:credentials}, process_stream).end()
        function process_stream(weather_stream){
            let weather_data = " ";
            weather_stream.on("data", chunk => weather_data += chunk);
            weather_stream.on("end", () => weather_results(weather_data, res));
        }         
    }   
    
    
    function weather_results(weather_data, res) {
        
      let weather = JSON.parse(weather_data);
      let data = weather.list[0];
      const city = data.name;
      const {temp, feels_like, temp_min, temp_max} = data.main;
      const weather_description = data.weather[0].description;
      results = `
      <h1>${city} Weather Forcast </h1> </a>
      Weather Type: ${weather_description} 
      <br>temperature : ${temp}&#8457
      <br>temperature : ${feels_like}&#8457
      <br>max temp:${temp_max}&#8457
      <br>min temp: ${temp_min}&#8457<br><br>`;
     
     
       res.writeHead(200, {"Content-Type": "text/html"});
       res.write(results , function(){
           console.log("Successfully generate weather");
           get_COVIDInfo(res);    
       }); 
       
    }
function get_COVIDInfo(res){
    const COVID19_endpoint = `https://api.covid19api.com/summary`
    https.request(COVID19_endpoint, {method:"GET"}, process_stream).end()
    function process_stream(COVID19_stream){
        let COVID19_data = " ";
        COVID19_stream.on("data", chunk => COVID19_data += chunk);
        COVID19_stream.on("end", () => COVID_results(COVID19_data, res));
    }
    function COVID_results(COVID19_data, res) {
        
       let COVID19 = JSON.parse(COVID19_data);
       results = getGlobalCases(COVID19);
       Countries = getCountriesCases(COVID19); 
       results = results.concat(Countries);
       res.end(results);
       console.log( "Successfully obtain COVID Data ");
    }   
    
}
}

function getGlobalCases(COVID19){
    const {NewConfirmed, TotalConfirmed,NewDeaths, TotalDeaths, NewRecovered,TotalRecovered} = COVID19.Global;

    result = ` <h1> COVID19 Cases</h1>
    <h2>Global Cases:</h2>
     New Cases: ${NewConfirmed}
      <br>New Death: ${NewDeaths}
      <br>New Recovered: ${NewRecovered}
      <br>Total Cases: ${TotalConfirmed}
      <br>Total Death: ${TotalDeaths}
      <br>Total Recovered: ${TotalRecovered}`;
     return result; 

} 
function getCountriesCases(COVID19){ 
    let index =[63, 84, 88, 182];
    result = '';
    for( i = 0; i < index.length; i++)
    {
    const {Country, NewConfirmed, TotalConfirmed,NewDeaths, TotalDeaths, NewRecovered,TotalRecovered} = COVID19.Countries[index[i]];
    x =`<h2>${Country} Cases:</h2>
     New Cases: ${NewConfirmed}
      <br>New Death: ${NewDeaths}
      <br>New Recovered: ${NewRecovered}
      <br>Total Cases: ${TotalConfirmed}
      <br>Total Death: ${TotalDeaths}
      <br>Total Recovered: ${TotalRecovered}`;

      result = result.concat(x);
    }
    return result;
}

server.on("listening", listen_handler)
function listen_handler(){
    console.log(`Now Listening on Port ${port}`)    
}
server.listen(port);
