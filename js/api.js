var API_VERSION     = "v0";
var API_HOST        = "https://dl-api.oddconcepts.kr";
var API_PORT        = "";

function noise() {
    if (navigator.serviceWorker !== undefined) {
        var n = new Date();
        return '' + n.getFullYear() + n.getMonth() + n.getDate() + n.getHours();
    }
    return '';
}

function api_detection_url(cb, url, category_hint) {
    var url = API_HOST + "/" + API_VERSION +
        "/detect?details=1&url=" + encodeURIComponent(url);

    $.ajax({
        url: url,
        type: "get",
        dataType: "json",
        async: true,
        beforeSend : function(xhr){
            xhr.setRequestHeader("ApiKey", window.localStorage.getItem("apikey"));
        },
        success: function (data) {
            return cb(data, category_hint);
        },
        error: function (data) {
            return cb(null);
        }
    });
}

function api_detection_file(cb, base64, extension) {
    var url = API_HOST + ":" + API_PORT + "/" + API_VERSION +
        "/detect?details=1&fileid=" + CryptoJS.MD5(base64).toString();

    base64 = base64.replace("data:" + extension + ";base64,", "");

    var formData = new FormData();
    var file = uri_to_blob(base64, "image/" + extension);
    formData.append("file", file);

    $.ajax({
        url: url,
        type: "post",
        data: formData,
        enctype: "multipart/form-data",
        processData: false,
        contentType: false,
        dataType: "json",
        async: true,
        beforeSend : function(xhr){
            xhr.setRequestHeader("ApiKey", window.localStorage.getItem("apikey"));
        },
        success: function (data) {
            return cb(data);
        },
        error: function (data) {
            return cb(null);
        }
    });
}

function api_search(cb, region_id, category_id, count) {
    var url = API_HOST + ":" + API_PORT + "/" + API_VERSION +
        "/search/" + region_id + "?category=" + category_id + '&count=' + count + '&rng=' + noise();

    $.ajax({
        url: url,
        type: "get",
        dataType: "json",
        async: true,
        beforeSend : function(xhr){
            xhr.setRequestHeader("ApiKey", window.localStorage.getItem("apikey"));
        },
        success: function (data) {
            return cb(data);
        },
        error: function (data) {
            return cb(null);
        }
    });
}

function api_search_advanced(cb, region_id, category_id, count, filter) {
    var url = API_HOST + ":" + API_PORT + "/" + API_VERSION +
            "/search/" + region_id + "?category=" + category_id + "&count=" + count + '&rng=' + noise();

    $.ajax({
        url: url,
        data: null,
        type: "post",
        dataType: "json",
        async: true,
        beforeSend: function(xhr) {
            xhr.setRequestHeader("ApiKey", window.localStorage.getItem("apikey"));
            xhr.setRequestHeader("Content-Type", "application/json");
        },
        success: function(data) {
            return cb(data);
        },
        error: function (data) {
            return cb(null);
        }
    });
}

function api_gsshop_search(cb, product_code) {
    var url = API_HOST + ":" + API_PORT + "/dupa/gsshop?product_code=" + product_code +
        "&lmr_classes=" + localStorage.getItem('classes') + "&lmr_constraints=" + localStorage.getItem('constraints')
         + '&rng=' + noise();

    $.ajax({
        url: url,
        data: null,
        type: "get",
        dataType: "json",
        async: true,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("ApiKey", window.localStorage.getItem("apikey"));
        },
        success: function (data) {
            return cb(data);
        },
        error: function (data) {
            return cb(null);
        }
    });
}
