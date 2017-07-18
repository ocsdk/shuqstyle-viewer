function get_image_size_from_url(cb, url) {
    $("<img/>", {
        load: function () {
            cb(this.width, this.height);
        },
        src: url
    });
}

function commify(n) {
    var reg = /(^[+-]?\d+)(\d{3})/;
    n += '';
    while (reg.test(n)) n = n.replace(reg, '$1' + ',' + '$2');
    return n;
}

function scroll(elem){
    var offset = $("#" + elem).offset();
    $('html, body').animate({scrollTop : offset.top}, 500);
}

function upload() {
    if (!window.localStorage) {
        alert("Your browser does not support file upload.");
        return;
    }

    window.localStorage.removeItem("base64");
    window.localStorage.removeItem("extension");

    var file = $("#file");
    var extension = file[0].files[0].type;
    var size = ((parseFloat(file[0].files[0].size)/1024.0)/1024.0);

    extensions = ["image/jpeg", "image/png"];

    if (extensions.indexOf(extension) <0) {
        alert(type + " is not supported.");
        return
    }

    if (size > 10.0) {
        alert("File size can't exceed 10mb.");
        return;
    }

    // converted to base64 format
    File.prototype.convertToBase64 = function (callback) {
        var rd = new FileReader();
        rd.onload = function (d) {
            callback(d.target.result);
        };
        rd.onerror = function (e) {
            callback(null);
        };
        rd.readAsDataURL(this);
    };

    file[0].files[0].convertToBase64(function (base64) {
        window.localStorage.setItem("base64", base64);
        window.localStorage.setItem("extension", extension);
        location.href = "./view.html?type=file&category_hint=&filter=";
    });
}

function uri_to_blob(dataURI, mime) {
    var byteString = window.atob(dataURI);
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++)
        ia[i] = byteString.charCodeAt(i);
    var blob = new Blob([ia], {type: mime});
    return blob;
}