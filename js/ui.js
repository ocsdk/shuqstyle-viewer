var M_BIT = 1073741824;
var F_BIT = 536870912;
var DRESSES = 1;
var PANTS = 2;
var SHORTS = 4;
var SKIRTS = 8;
var TOPS = 16;
var OUTERS = 32;
var M_TOPS = M_BIT | TOPS;
var M_PANTS = M_BIT | PANTS;
var M_SHORTS = M_BIT | SHORTS;
var M_OUTERS = M_BIT | OUTERS;
var F_TOPS = F_BIT | TOPS;
var F_PANTS = F_BIT | PANTS;
var F_SHORTS = F_BIT | SHORTS;
var F_SKIRTS = F_BIT | SKIRTS;
var F_DRESSES = F_BIT | DRESSES;
var F_OUTERS = F_BIT | OUTERS;

$(document).ready(function() {
    $("input[type=text]").keypress(function(e) {
        if (e.keyCode == 13) {
            if ($('#input_apikey').is(':focus') && $('#input_apikey').val() != '') {
                return $('#input_apikey').blur()
            }
            else if ($("#input_url").val() != '') {
                view_gsdemo($("#input_url").val(), null, null);
            }
        }
    });

    $('#input_apikey').blur(function(e) {
        window.localStorage.setItem("apikey", e.target.value);
        $('#api-key-scrollin').css('margin-top', '-50px');
    })

    var scroller = new FTScroller(document.querySelector('body'), {
        bouncing: false,
        scrollbars: false
    });

    var apiKey = window.localStorage.getItem("apikey");

    if (apiKey != null)
        $('#input_apikey').val(apiKey);
});

function view_demo(url) {
    if (window.localStorage.getItem("apikey") == null) {
        alert('No API Key has been configured. Use the configuration dialog to set an API key.')
        return
    }

    var image_url = url;
    location.href = "./view.html?type=url&url=" + encodeURIComponent(image_url);
}

function view_gsdemo(url, category_hint, filter) {
    if (window.localStorage.getItem("apikey") == null) {
        alert('No API Key has been configured. Use the configuration dialog to set an API key.');
        return
    }
    readMissingFile('demos/gsshop_missing.pkl');
    var image_url = url;
    if (category_hint != null) {
        location.href = "./view.html?type=url&url=" + encodeURIComponent(image_url) + '&category_hint=' + category_hint + '&filter=';
    }
    else {
        location.href = "./view.html?type=url&url=" + encodeURIComponent(image_url) + '&category_hint=&filter=';
    }
}

function show_api_key_scrollin() {
    $('#api-key-scrollin').css('margin-top', '0px');
}