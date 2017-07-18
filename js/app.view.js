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

var CATEGORY = {
    "male": [
        {"name": "Tops", "caid": M_TOPS},
        {"name": "Pants", "caid": M_PANTS},
        {"name": "Shorts", "caid": M_SHORTS},
        {"name": "Outers", "caid": M_OUTERS}
    ],
    "female": [
        {"name": "Tops", "caid": F_TOPS},
        {"name": "Pants", "caid": F_PANTS},
        {"name": "Shorts", "caid": F_SHORTS},
        {"name": "Skirts", "caid": F_SKIRTS},
        {"name": "Dresses", "caid": F_DRESSES},
        {"name": "Outers", "caid": F_OUTERS}
    ],
    "both": [
        {"name": "Tops", "caid": TOPS},
        {"name": "Pants", "caid": PANTS},
        {"name": "Shorts", "caid": SHORTS},
        {"name": "Outers", "caid": OUTERS}
    ]
};

var CATEGORY_ID_TO_NAME = {
    1: "Dresses",
    2: "Pants",
    4: "Shorts",
    8: "Skirts",
    16: "Tops",
    32: "Outers"
};

var current_image_url;
var current_image_size = {"width": 0, "height": 0};
var current_sex;
var current_category_ids = [];
var detection_results_elems = [];
var cropper;
var classification_map = {};
var re_search = false;

$(document).ready(function() {
    var uri = new URI(location.href);
    var params = uri.search(true);
    var type = params["type"];

    if (type == undefined) {
        error_and_go_home("Type does not exist.");
        return;
    } else if (type == "url") {
        var image_url = params["url"];
        var category_hint = params["category_hint"];
        var filter = params["filter"];
    } else if (type == "file") {
        var image_url = localStorage.getItem("base64");
        var image_extension = localStorage.getItem("extension");
        var category_hint = null;
        var filter = null;
    } else {
        error_and_go_home("Unknown type");
        return;
    }

    if (image_url == undefined)
        error_and_go_home("Image url does not exist.");

    current_image_url = image_url;

    // detect
    var detection_cb = function (results, category_hint) {
        if (results == null) {
            alert("API request failed. This is most likely due to an invalid API key.");
            location.href = "/";
        }

        hide_loader_modal();

        var list = results.list;
        var keys = [];
        for (var k in results.list) {
            keys.push(k);
        }

        var region = null;

        var top_score = 0.0;
        var top_category_id = null;
        var top_region_id = null;
        var top_details = null;

        var gender_hint = null;
        var cate_hint = null;

        var category_id = null;
        var region_id = null;
        var details = null;
        var score = null;

        var classification_map_id = null;
        if (category_hint != null) {
            gender_hint = category_hint & (M_BIT | F_BIT);
            cate_hint = category_hint & (DRESSES | PANTS | SHORTS | SKIRTS | TOPS | OUTERS);
        }

        if (results.status && keys.length > 0) {
            if (category_hint != null && $.inArray(keys, cate_hint.toString())) {
                region = list[cate_hint][0];
                category_id = parseInt(cate_hint | gender_hint);
                region_id = list[cate_hint][0].id;
                details = list[cate_hint][0].details;
                score = list[cate_hint][0].score;

                if (score > top_score) {
                    top_score = score;
                    top_category_id = category_id;
                    top_region_id = region_id;
                    top_details = details;
                }

                classification_map_id = category_id + '_' + region_id;
                classification_map[classification_map_id] = details;

                current_sex = get_sex(category_id);
                details.sex.label = current_sex;

                show_detection_results(list);

                select_detection_results(top_category_id, top_region_id);
            }
            else if (list[keys[0]].length > 0) {
                region = list[keys[0]][0];
                category_id = parseInt(keys[0]);
                region_id = list[keys[0]][0].id;
                details = list[keys[0]][0].details;
                score = list[keys[0]][0].score;

                if (score > top_score) {
                    top_score = score;
                    top_category_id = category_id;
                    top_region_id = region_id;
                    top_details = details;
                }

                classification_map_id = category_id + '_' + region_id;
                classification_map[classification_map_id] = details;

                // 여성 의류 카테고리는 강제 변환
                if (category_id == SKIRTS || category_id == DRESSES)
                    category_id = category_id|F_BIT;

                current_sex = get_sex(category_id);

                // show detection results
                show_detection_results(list);

                // select detection results
                select_detection_results(category_id, region_id);
            }
            re_search = true
        }

        if (top_category_id != null && top_region_id != null) {
            select_sex(details.sex.label, region_id, category_id);

            gendered_category = category_id;
            gendered_category |= details.sex.label == 'male' ? M_BIT : F_BIT;

            select_detection_results(gendered_category, region_id);
        }

        if (top_details != null) {
            window.setTimeout(function() {
                show_classification_results(details);
            }, 50);
        }

        // init cropper
        init_cropper(image_url, region);
    };

    show_loader_modal();

    if (type == "url")
        api_detection_url(detection_cb, image_url, category_hint);
    else if (type == "file")
        api_detection_file(detection_cb, image_url, image_extension);
});

function error_and_go_home(msg) {
    alert(msg);
    location.replace("/");
}

function get_sex(category_id) {
    if ((category_id^F_BIT) <= 32)
        return "female";
    if ((category_id^M_BIT) <= 32)
        return "male";
    if (category_id <= 32)
        return "both";
}

function show_detection_results(list) {
    document.getElementById("results_detection").style.display = "block";

    var contents = "";
    var progress_list = [];

    for (key in list) {
        for (var j=0; j<list[key].length; j++) {
            var category_id = key;
            var region_id = list[key][j].id;
            var details = list[key][j].details;

            // TODO: Remove this routing
            if (details.length > 0)
                details = details[0];

            var classification_map_id = category_id + '_' + region_id;
            classification_map[classification_map_id] = details;

            var elem_id = "detection_" + category_id + "_" + region_id;
            // convert
            elem_id = elem_id.replace(/,/gi, "_");

            detection_results_elems.push(elem_id);

            var progress_id = "detection_progress_" + category_id + "_" + region_id;
            // convert
            progress_id = progress_id.replace(/,/gi, "_");

            var progress_score = list[key][j].score;
            var region = JSON.stringify(list[key][j]);

            progress_list.push({"id": progress_id, "score": progress_score});

            contents += "<div class='item' id='" + elem_id + "'>" +
                "<a href='javascript:change_cropper(" + region + ", " + category_id + ", \"" + region_id + "\")'>" +
                CATEGORY_ID_TO_NAME[key] + " #" + (j+1) + "</a>" +
                "<div id='" + progress_id + "'></div>" +
                "</div>";
        }
    }

    document.getElementById("detection_list").innerHTML = contents;

    for (var i=0; i<progress_list.length; i++) {
        var id = "#" + progress_list[i].id;
        var score = progress_list[i].score;
        $(id).goalProgress({
            goalAmount: 100,
            currentAmount: 100*score,
            text: score.toFixed(2)
        });
    }
}

function show_classification_results(details) {
    if (details == null)
        return;

    document.getElementById("results_classification").style.display = "block";

    // print sex chart
    var sex_labels = null;
    if (details.sex.label == 'female')
        sex_labels = ['female', 'male'];
    else
        sex_labels = ['male', 'female'];
    var sex_data = [details.sex.probability, 1-details.sex.probability];
    show_chart(document.getElementById("classification_chart_sex"),
               sex_labels, sex_data);

    // print cloth chart
    var cate_b_labels = [];
    var cate_b_data = [];
    for (var i=0; i<details.cate_b.length; i++) {
        cate_b_labels.push(details.cate_b[i].label);
        cate_b_data.push(details.cate_b[i].probability);
    }
    show_chart(document.getElementById("classification_chart_cloth"),
               cate_b_labels, cate_b_data);
}

function show_chart(ctx, labels, data) {
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });
}

function init_cropper(url, region) {
    document.getElementById("thumbnail_view").src = url;

    cropper = $("#thumbnail_view").cropper({
        guides: false,
        highlight: false,
        zoomable: false,
        checkCrossOrigin: false,
        viewMode: 2,
        crop: function (e) {},
        built: function() {
            var image_size_cb = function (width, height) {
                current_image_size.width = width;
                current_image_size.height = height;

                change_cropper(region, null, null);
            };

            get_image_size_from_url(image_size_cb, url);
        }
    });

    cropper.cropper("disable");
}

function change_cropper(region, category_id, region_id) {
    var image_view = document.getElementById("image_view");
    var display_width = image_view.clientWidth;
    var display_height = image_view.clientHeight;

/*
    var resize_size = 500;
    var resize_width = current_image_size.width;
    var resize_height = current_image_size.height;

    if (current_image_size.width > current_image_size.height) {
        if (current_image_size.width > resize_size) {
            resize_width = resize_size;
            resize_height = (resize_size*current_image_size.height)/current_image_size.width;
        }
    } else {
        if (current_image_size.height > resize_size) {
            resize_height = resize_size;
            resize_width = (resize_size*current_image_size.width)/current_image_size.height;
        }
    }

    var ox1 = region.x1*(current_image_size.width/resize_width);
    var oy1 = region.y1*(current_image_size.height/resize_height);
    var ox2 = region.x2*(current_image_size.width/resize_width);
    var oy2 = region.y2*(current_image_size.height/resize_height);

    var display_left = ox1*(display_width/current_image_size.width);
    var display_top = oy1*(display_height/current_image_size.height);
    var display_width = ox2*(display_width/current_image_size.width) - display_left;
    var display_height = oy2*(display_height/current_image_size.height) - display_top;
*/

    var display_left = display_width*region.rx1;
    var display_top = display_height*region.ry1;
    var display_width = display_width*region.rx2 - display_left;
    var display_height = display_height*region.ry2 - display_top;

    // enable cropper
    $("#thumbnail_view").cropper('enable');

    cropper.cropper("setCropBoxData", {
        left: display_left,
        top: display_top,
        width: display_width,
        height: display_height
    });

    // disable cropper
    $("#thumbnail_view").cropper('disable');

    // select detection results
    select_detection_results(category_id, region_id);

    // show classification results
    var classification_map_id = category_id + '_' + region_id;
    show_classification_results(classification_map[classification_map_id]);
}

function select_detection_results(category_id, region_id) {
    if (category_id == null || region_id == null)
        return;

    // 여성 의류 both category_id로 변환
    if ((category_id^F_BIT) <= 32)
        category_id = category_id^F_BIT;

    // remove class
    for (var i=0; i<detection_results_elems.length; i++) {
        $("#" + detection_results_elems[i]).removeClass("select");
    }

    var elem_id = "detection_" + category_id + "_" + region_id;
    // convert
    elem_id = elem_id.replace(/,/gi, "_");

    var progress_id = "detection_progress_" + category_id + "_" + region_id;
    // convert
    progress_id = progress_id.replace(/,/gi, "_");

    // add class
    $("#" + elem_id).addClass("select");

    // 여성 의류 category_id 복원
    if (category_id == SKIRTS || category_id == DRESSES)
        category_id = category_id|F_BIT;

    // search
    if (re_search) {
        search(region_id, category_id, true, false);
    }
}

function init_search_category(region_id, category_id, init) {
    var contents = "";

    current_sex = get_sex(category_id);
    var current_cate = category_id & (DRESSES | PANTS | SHORTS | SKIRTS | TOPS | OUTERS);

    // Sex
    contents += "<div class='sex-list'>";
    if (current_sex == "male") {
        contents += "<a class=\"sex select\">Male</a>";
        contents += "<a class=\"sex\" href=\"javascript:select_sex('female', '" + region_id + ","+ current_cate + "')\">Female</a>";
        contents += "<a class=\"sex\" href=\"javascript:select_sex('both', '" + region_id + "," + current_cate + "')\">Both</a>";
    }
    else if (current_sex == "female") {
        contents += "<a class=\"sex\" href=\"javascript:select_sex('male', '" + region_id + "," + current_cate + "')\">Male</a>";
        contents += "<a class=\"sex select\">Female</a>";
        contents += "<a class=\"sex\" href=\"javascript:select_sex('both', '" + region_id + "," + current_cate + "')\">Both</a>";
    } else if (current_sex == "both") {
        contents += "<a class=\"sex\" href=\"javascript:select_sex('male', '" + region_id + "," + current_cate + "')\">Male</a>";
        contents += "<a class=\"sex\" href=\"javascript:select_sex('female', '" + region_id + "," + current_cate + "')\">Female</a>";
        contents += "<a class=\"sex select\">Both</a>";
    }
    contents += "</div>";

    if (!init) {
        var ccids = current_category_ids.indexOf(category_id);
        if (ccids < 0) {
            current_category_ids.push(category_id);
        } else {
            if (current_category_ids.length > 1)
                current_category_ids.splice(ccids, 1);
        }
    } else {
        current_category_ids = [category_id];
    }

    // Category
    contents += "<div class='category-list'>";
    for (var i=0; i<CATEGORY[current_sex].length; i++) {
        if (current_category_ids.indexOf(CATEGORY[current_sex][i].caid) < 0)
            contents += "<a class=\"category\" href=\"javascript:search('" + region_id + "', " + CATEGORY[current_sex][i].caid + ", false, true)\">" + CATEGORY[current_sex][i].name + "</a>";
        else
            contents += "<a class=\"category select\" href=\"javascript:search('" + region_id + "', " + CATEGORY[current_sex][i].caid + ", false, true)\">" + CATEGORY[current_sex][i].name + "</a>";
    }
    contents += "</div>";

    document.getElementById("searchable_category_list").innerHTML = contents;
}

function select_sex(sex, region_id, category_id) {
    current_sex = sex;
    current_category_ids = [];

    search(region_id, category_id, false, false);
}

function search(region_id, category_id, init, use_scroll) {
    document.getElementById("results_search").style.display = "block";

    init_search_category(region_id, category_id, init);

    // clear results
    document.getElementById("search_list").innerHTML = "<div class='blank-space'>&nbsp;</div>";

    var $grid = $("#search_list").masonry({
        columnWidth: 1,
        itemSelector: ".grid-item",
        gutter: 5
    });

    function addItemElem(name, price, link, image_url, background_pos) {
        var elem = document.createElement("div");
        elem.className = "grid-item";
        elem.innerHTML = '<img class="thumbnail" src="images/spacer.gif" style="background-image: url(\'' + image_url + '\'); background-position: ' + background_pos + '">' +
            '<a href="./view.html?type=url&url=' + encodeURIComponent(image_url) + '"><div class="view-button"><img src="images/icon_search.svg"></div></a>' +
            '<div class="name"><a href="' + link + '">' + name + '</a></div>' +
            '<div class="price"><a href="' + link + '">' + commify(price) + ' KRW</a></div>';
        var $elem = $(elem);
        $grid.append($elem).masonry("appended", $elem);
    }

    var search_cb = function (results) {
        document.querySelector('.blank-space').style.display = 'none';
        hide_loader_modal();

        var keys = [];
        for (var k in results) {
            keys.push(k);
        }

        if (key.length > 0 && use_scroll) {
//             scroll("search_list");
        }

        for (var i=0; i<keys.length; i++) {
            var list = results[keys[i]];
            for (var j=0; j<list.length; j++) {
                var r = list[j].region;
                var backgroundPos = Math.floor((r[0] + (r[2] - r[0]) / 2) /
                    list[j].size_info[0] * 100) + '% ';
                addItemElem(list[j].name, list[j].price, list[j].product_url, list[j].image_url, backgroundPos);
            }
        }

        $grid.imagesLoaded(function() {
            $grid.masonry();
        });
    };

    show_loader_modal();

    // current_category_ids => category_id (multi category search)
    category_id = 0;
    for (var i=0; i<current_category_ids.length; i++) {
        category_id |= current_category_ids[i];
    }

    api_search_advanced(search_cb, region_id, category_id, 34, null);
}

function show_loader_modal() {
    document.getElementById("loader_modal").style.display = "table";
}

function hide_loader_modal() {
    document.getElementById("loader_modal").style.display = "none";
}
