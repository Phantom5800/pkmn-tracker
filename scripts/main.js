var urlParams = {};

function getUrlParamCount() {
    return Object.keys(urlParams).length;
}

function getUrlVars() {
    if (getUrlParamCount() === 0) {
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            urlParams[key.toLowerCase()] = value;
        });
    }
    return urlParams;
}

function getUrlParam(parameter, defaultValue) {
    var urlParameter = defaultValue;
    if (parameter in urlParams) {
        urlParameter = urlParams[parameter];
    }
    return urlParameter;
}

function localStorageGetWithDefault(key, defaultValue) {
    const urlVal = getUrlParam(key, defaultValue);
    if (urlVal === defaultValue) {
        const value = localStorage.getItem(key);
        if (!value) {
            localStorage.setItem(key, defaultValue);
            return defaultValue;
        }
        return value;
    }
    return urlVal;
}

function saveCurrentPlanned() {
    var planned = "";
    $("div.pkmn-box").each(function() {
        if ($(this).is(':visible')) {
            if ($(this).hasClass("planned") || !$(this).hasClass("unselected")) {
                planned = `${planned} ${$(this).children("img").attr("src")}`;
            }
        }
    });

    localStorage.setItem(`${$("#pkmn-game").val()}-planned`, planned);
}

function loadPlanned() {
    resetPage();
    var planned = localStorageGetWithDefault(`${$("#pkmn-game").val()}-planned`, "");
    if (planned) {
        var list = planned.split(" ");
        for (var img in list) {
            $(`div.pkmn-box img[src='${list[img]}']`).parent().contextmenu();
        }
    }
}

function setCurrentPokemon() {
    var current = 0;
    var planned = 0;

    $("div.pkmn-box").each(function() {
        if ($(this).is(':visible')) {
            if ($(this).hasClass("planned")) {
                ++planned;
            } else if (!$(this).hasClass("unselected")) {
                ++planned;
                ++current;
            }
        }
    });
    $(".section h1").text(`Total Pokémon: ${current} (${planned})`);
}

$(document).ready(function(){
    getUrlVars();

    // disable some basic functionality
    $('html').contextmenu(function(){return false;});
    $('img').on('dragstart', function(){return false;});

    $(".pkmn-box").click(function() {
        if ($(this).hasClass("planned")) {
            $(this).removeClass("planned");
        } else {
            $(this).toggleClass("unselected");
        }

        setCurrentPokemon();
    });

    $(".pkmn-box").contextmenu(function() {
        $(this).toggleClass("planned");
        $(this).toggleClass("unselected", !$(this).hasClass("planned"));
        setCurrentPokemon();
        return false;
    });

    ////////////////////////////////////////////////////////////////
    // options menu
    ////////////////////////////////////////////////////////////////

    // hide options menu when clicking anywhere on the page
    $(document).click(function(e) {
        // if the option menu is open, and the click is outside the options menu, close it
        var container = $("#options-menu");
        if (container.hasClass("options-open") && !container.is(e.target) && container.has(e.target).length === 0) {
            $("#options-menu-toggle").click();
        }
    });

    // show / hide options menu
    $("#options-menu-toggle").click(function(e) {
        e.stopPropagation();
        $(this).toggleClass("options-open");
        $("#options-menu").toggleClass("options-open");
    });

    // reset the tracker completely
    $("#reset-button").click(function() {
        var confirmation = confirm("Are you sure you want to reset?");
        if (confirmation) {
            loadPlanned();
        }
        $(this).blur();
    });

    $("#save-button").click(function() {
        var hasPlanned = localStorageGetWithDefault(`${$("#pkmn-game").val()}-planned`, "") !== "";
        if (hasPlanned) {
            var confirmation = confirm("Overwrite existing planned catches?");
            if (confirmation) {
                saveCurrentPlanned();
            }
        } else {
            saveCurrentPlanned();
        }
        $(this).blur();
    });

    // save the tracker width
    const tracker_observer = new ResizeObserver(() => {
        localStorage.setItem("tracker-width", $(".main-tracker").width());
    });
    tracker_observer.observe($(".main-tracker").get(0));
    $(".main-tracker").width(localStorageGetWithDefault("tracker-width", "36em"));

    ////////////////////////////////////////////////////////////////
    // game selector
    ////////////////////////////////////////////////////////////////

    $("#pkmn-game").on("change", function() {
        var pkmn_game = $(this).val();
        localStorage.setItem("pkmn-game", pkmn_game);

        $("div.pkmn-box").each(function() {
            var valid_games = $(this).attr("data-valid-games");
            if (valid_games) {
                $(this).toggle(valid_games.includes(pkmn_game));
            } else {
                $(this).toggle(false);   
            }
        });

        setCurrentPokemon();
    });

    var pkmn_game = localStorageGetWithDefault("pkmn-game", "lgp-any");
    $("#pkmn-game").val(pkmn_game).change();

    ////////////////////////////////////////////////////////////////
    // tracker specific settings
    ////////////////////////////////////////////////////////////////

    $("#background-color").on("input", function() {
        var color = $(this).val();
        $("body, html").css("background-color", color);
        localStorage.setItem("background-color", color);
    });

    $("#section-color").on("input", function() {
        var color = $(this).val();
        $(".section").css("background-color", color);
        localStorage.setItem("section-color", color);
    });

    ////////////////////////////////////////////////////////////////
    // misc. local storage settings
    ////////////////////////////////////////////////////////////////

    var bg_color = localStorageGetWithDefault("background-color", "#212121");
    $("body, html").css("background-color", bg_color);
    $("#background-color").val(bg_color);

    var section_color = localStorageGetWithDefault("section-color", "#a8a8a8");
    $(".section").css("background-color", section_color);
    $("#section-color").val(section_color);

    setCurrentPokemon();

    ////////////////////////////////////////////////////////////////
    // on screen timer
    ////////////////////////////////////////////////////////////////

    var hourSelector = $("#hour-selector");
    var minuteSelector = $("#minute-selector");
    var secondSelector = $("#second-selector");
    var hour = $("#hour");
    var minute = $("#minute");
    var second = $("#second");

    var displayedTime = {
        hour: 23,
        minute: 33,
        second: 0,
    };

    var lastDifference = 0;

    var startTime = new Date().getTime();

    var displayHour = () => {
        var hourText = displayedTime.hour;
        if (hourText < 10) {
            hourText = "0" + hourText;
        }
        hour.text(hourText);
    };

    var displayMinute = () => {
        var minuteText = displayedTime.minute;
        if (minuteText < 10) {
            minuteText = "0" + minuteText;
        }
        minute.text(minuteText);
    };

    var displaySecond = () => {
        var secondText = displayedTime.second;
        if (secondText < 10) {
            secondText = "0" + secondText;
        }
        second.text(secondText);
    };

    var updateTimer = () => {
        var time = new Date().getTime();
        var difference = time - startTime;

        difference -= difference % 1000;
        difference /= 1000;

        if (lastDifference === difference) {
            return;
        }

        var toAddSeconds = difference - lastDifference;
        var toAddMinutes = 0;
        var toAddHours = 0;

        var newSecond = displayedTime.second + toAddSeconds;
        while (newSecond > 59) {
            newSecond-= 60;
            ++toAddMinutes;
        }

        if (newSecond !== displayedTime.second) {
            displayedTime.second = newSecond;
            displaySecond();
        }

        var newMinute = displayedTime.minute + toAddMinutes;
        while (newMinute > 59) {
            newMinute-= 60;
            ++toAddHours;
        }

        if (newMinute !== displayedTime.minute) {
            displayedTime.minute = newMinute;
            displayMinute();
        }

        var newHour = displayedTime.hour + toAddHours;
        while (newHour > 23) {
            newHour-= 24;
        }

        if (newHour !== displayedTime.hour) {
            displayedTime.hour = newHour;
            displayHour();
        }

        lastDifference = difference;
    };

    displayHour();
    displayMinute();
    displaySecond();

    setInterval(updateTimer, 50);

    $("#time-tracker button").click(function() {
        var hour = parseInt(hourSelector.val(), 10);
        var minute = parseInt(minuteSelector.val(), 10);
        var second = parseInt(secondSelector.val(), 10);

        startTime = new Date().getTime();
        lastDifference = 0;

        displayedTime.hour = hour;
        displayedTime.minute = minute;
        displayedTime.second = second;

        displayHour();
        displayMinute();
        displaySecond();

        $(this).blur();
    });
});

function resetPage() {
    $(".pkmn-box").each(function() {
        if ($(this).is(':visible')) {
            if ($(this).hasClass("planned")) {
                $(this).contextmenu();
            } else if (!$(this).hasClass("unselected")) {
                $(this).click();
            }
        }
    });
}

