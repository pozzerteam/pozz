/**
param: name(string)
return: converted string into jQuery id selector (string)
**/

function jQueryID(name) { 
    "use strict";
    if (typeof name === "string") {
        return "#" + name;
    } else {
        console.log("Utility:jQueryID: variable 'name' of " + name + " is not of type string");
    }
}

/**
param: name(string)
return: converted string into jQuery class selector (string)
**/
function jQueryClass(name)
{
    "use strict";
    if (typeof name === "string") {
        return "." + name;
    } else {
        console.log("Utility:jQueryClass: variable 'name' of " + name + " is not of type string");
    }
}


function encode(the_address)
{
    the_address = the_address.split(" ").join("+");
    return the_address;
}

        function parseJSON(the_text)
        {
            var obj = JSON.parse(the_text);
            $('.clear').html("this is a test");
            var content = $('.clear');
            content.append('<p>Total distance: ' + obj.routes[0].legs[0].distance.text + '</p>' );
            content.append('<p>Directions</p>');
            content.append('<ol>');
            for(var i = 0; i < obj.routes[0].legs[0].steps.length; i++) {
                content.append('<li>' + obj.routes[0].legs[0].steps[i].html_instructions + '</li>');
            }
            content.append('</ol>');
        }
        
        /* param:JSON object
         * return:string 
         */
        function getMapDistanceByCar(myJSON)
        {
            return myJSON.routes[0].legs[0].distance.text;
        }
        
        function getDirectionInHTML(myJSON)
        {
            var directions = [];
            for(var i = 0; i < myJSON.routes[0].legs[0].steps.length; i++) {
                directions.push(myJSON.routes[0].legs[0].steps[i].html_instructions);
            }
            return directions;
        }