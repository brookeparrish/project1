$(document).ready(function () {
    // global variables
    let opencageKey = 'c78f665164ae437d8b8cc39081f7e3ff';
    let darkskyKey = "9f1107bdae4244be0aadbf24108d9771";
    var eventfulKey = `fWBHtdbcHkhq4Lcr`;
    let formattedWeatherDateTime;
    let solveCorsError = 'https://cors-anywhere.herokuapp.com/';


    $(".loader").hide();
    function autoFill() {
        var placesAutocomplete = places({
            countries: ['us'], // Search in the United States of America and in the Russian Federation
            type: 'city', // Search only for cities names
            aroundLatLngViaIP: false, // disable the extra search/boost around the source IP
            appId: 'plIL9UL82OV7',
            apiKey: '0af80e9e7ca21da5ad41e64a38158240',
            container: document.querySelector('#inlineFormInput')
        })
    };
    autoFill();

    // Code starts executing on this button click
    $(document).on("click", ".btn", function (event) {

        event.preventDefault();
        $(".loader").show();
        let city = $("#inlineFormInput").val();
        opencageCall(city);
    });

    // API that converts city into lat/lon coordinates
    function opencageCall(city) {
        let opencageUrl = `https://api.opencagedata.com/geocode/v1/json?q=${city}%2C%20usa&key=${opencageKey}&language=en&pretty=1`;
        $.ajax({
            url: opencageUrl,
            method: "GET"

        })
            .then(function (response) {
                console.log(response);
                let lat = response.results[0].geometry.lat;
                let lon = response.results[0].geometry.lng;
                darkskyCall(lat, lon, city);
            },
            function(error) {
                console.error(error);
            })
    };

    // WeatherAPI
    function darkskyCall(lat, lon, city) {
        let darkskyUrl = `${solveCorsError}https://api.darksky.net/forecast/${darkskyKey}/${lat},${lon}?extend=hourly`;
        $.ajax({
            url: darkskyUrl,
            method: "GET"
        })
            .then(function (response) {
                eventfulCall(city, response);
            },
            function(error) {
                console.error(error);
            })
    };

    // function declarations
    function eventfulCall(city, darkskyResponse) {
        let queryUrl = `${solveCorsError}http://api.eventful.com/json/events/search?app_key=${eventfulKey}&location=${city}&sort_order=popularity&date=this week`;
        // let queryUrl = `https://cors-anywhere.herokuapp.com/http://api.eventful.com/json/categories/list?app_key=${eventfulKey}`;
        $.ajax(
            {
                url: queryUrl,
                method: "GET"
            }
        ).then(
            function (responseUnformatted) {
                let response = JSON.parse(responseUnformatted);
                console.log(response);
                let darkskyHourlyDataArr = darkskyResponse.hourly.data;
                $("tbody").empty();
                for (let i = 0; i < response.events.event.length; i++) {
                    let eventTitle = response.events.event[i].title;
                    let eventVenue = response.events.event[i].venue_name;
                    let eventAddress = response.events.event[i].venue_address;
                    let eventDateTimeStr = response.events.event[i].start_time;
                    let formattedEventDateTime = moment(eventDateTimeStr).format('LLLL');
                    let eventDateTimeArr = response.events.event[i].start_time.split(" ");
                    let eventDate = moment(eventDateTimeArr[0]).format('dddd, MMMM Do YYYY');
                    let eventTime = moment(eventDateTimeArr[1], 'HH:mm:ss').format('h:mm A');
                    let eventImageWithLocalPath = response.events.event[i].image.medium.url;
                    let webPath = "https:";
                    let eventImage = webPath + eventImageWithLocalPath;
                    for (let j = 0; j < darkskyHourlyDataArr.length; j++) {
                        let darkskyDateTime = moment.unix(darkskyHourlyDataArr[j].time).format('LLLL');
                        let darkskyMinusEventTime = moment(darkskyDateTime).diff(moment(formattedEventDateTime), "minutes");
                        let eventMinusDarksky = moment(formattedEventDateTime).diff(moment(darkskyDateTime), "minutes");
                        if (darkskyDateTime == formattedEventDateTime || darkskyMinusEventTime <= 30 && darkskyMinusEventTime >= 0 || eventMinusDarksky < 30 && eventMinusDarksky >= 0) {
                            let cloudiness = darkskyResponse.hourly.data[j].summary;
                            let mainTemp = Math.round(darkskyResponse.hourly.data[j].temperature);
                            // This is for table data
                            let tRow = $("<tr>");
                            let tData = $(
                                "<td>" + eventTitle + "</td>" +
                                "<td>" + eventVenue + "</td>" +
                                "<td>" + eventAddress + "</td>" +
                                "<td>" + eventDate + "</td>" +
                                "<td>" + eventTime + "</td>" +
                                "<td>" + `${cloudiness}, Temp(F) = ${mainTemp}` + "</td>");
                            $(tRow).append(tData);
                            $("tbody").append(tRow);
                            // This is for card data
                            let cData = $(
                                '<div class="card" style="width: 18rem;"><img class="card-img-top" src="' + eventImage + '" alt="Card Image"><div class="card-body">' +
                                '<h5 class="card-title event">' + eventTitle + '</h5>' +
                                '<p class="card-text date">' + eventDate + '</p></div><ul class="list-group list-group-flush">' +
                                '<li class="list-group-item venue">' + eventVenue + '</li>' +
                                '<li class="list-group-item address">' + eventAddress + '</li>' +
                                '<li class="list-group-item time">' + eventTime + '</li>' +
                                '<li class="list-group-item weather">' + `${cloudiness}, Temp(F) = ${mainTemp}` + '</li>' +
                                '</ul></div>'
                            )
                            $(".card-div").append(cData);
                            $(".loader").hide();
                        }
                    }
                }
            },
            function (error) {
                console.log(error)
            });
    };
})