
        //Element Ids
        var originAddress = "map-start-address";
        var destAddress = "map-end-address";
        var swapAddressButton = "map-interchange-button";
        var mapCanvas = "map-canvas";
        var directionsPanel = "directions-panel";
        var mapTrigger = "map-trigger";
        var mapModal = "mapModal";
        var mapCloseButton = "map-close";
            
        /** Testing variables **/
        var testAddress = "4555 Roosevelt Way NE, Seattle WA 98105";
        /** Testing variables **/
        
        var directionsDisplay;
        var directionsService = new google.maps.DirectionsService();
            
        
        function addressSwap()
        {
            var temp_address_holder = $(jQueryID(originAddress)).val();
            $(jQueryID(originAddress)).val($(jQueryID(destAddress)).val());
            $(jQueryID(destAddress)).val(temp_address_holder);
        }
            
    
        function initialize() {
          directionsDisplay = new google.maps.DirectionsRenderer();
          var mapOptions = {
            zoom: 7,
            center: new google.maps.LatLng(41.850033, -87.6500523)
          };
          var map = new google.maps.Map(document.getElementById(mapCanvas),
              mapOptions);
          directionsDisplay.setMap(map);
          directionsDisplay.setPanel(document.getElementById(directionsPanel));
        
        //  var control = document.getElementById('control');
        //  control.style.display = 'block';
        //  map.controls[google.maps.ControlPosition.TOP_CENTER].push(control);
        }
        
        function calcRoute() {
          var start = document.getElementById(originAddress).value;
          var end = document.getElementById(destAddress).value;
          var request = {
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode.DRIVING
          };
          directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
              directionsDisplay.setDirections(response);
            }
          });
        }
        
        $(document).ready(function(){
            $(jQueryID(destAddress)).val(testAddress);
            
            $(jQueryClass(mapTrigger)).click(function(){
//                $(jQueryID(mapModal)).modal("show");
                $(jQueryID(originAddress)).val($(this).attr("alt"));
//                calcRoute();
                $(jQueryID(mapModal)).modal("show");
            });
            
            $(jQueryID(mapCloseButton)).click(function(){
               $(jQueryID(mapModal)).modal("hide");
            });
            
            $(jQueryID(mapModal)).on('shown.bs.modal', function(e){
                initialize();
                calcRoute();
            });
        });
        
//        google.maps.event.addDomListener(window, 'load', initialize);
    
        