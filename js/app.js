function fetchData(url) {
    return fetch(url)
        .then(res => {
            if (res.ok) {
                return res.json();
            }
            throw new Error('Api did not respond...');
        })
        .then(data => {
            return data;
        });
}

function buildBlueBox() {
    fetchData(`https://api.etherscan.io/api?module=stats&action=ethprice`)
        .then(function (data) {
            let currentPriceText = '$' + data.result.ethusd + ' @ ' + data.result.ethbtc;
            $('#price').fadeOut(0, function () {
                $(this).html(currentPriceText).fadeIn(500);
            });
        });

    fetchData(`https://api.etherscan.io/api?module=proxy&action=eth_blockNumber`)
        .then(function (data) {
            let currentBlockNo = data.result;
            $('#last-block').fadeOut(0, function () {
                $(this).html(parseInt(currentBlockNo)).fadeIn(500);
            });
        });
}

$(function () {
    var timer = null,
        interval = 1000,
        value = 0;

    $("#toggle-realtime").change(function () {
        if ($(this).is(':checked')) {
            // Checkbox is checked..
            if (timer !== null) return;
            timer = setInterval(function () {
                console.log(++value);
            }, interval);
        } else {
            // Checkbox is not checked..
            clearInterval(timer);
            timer = null;
        }
    });

    buildBlueBox();
});
