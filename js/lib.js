
function turkishToLower(str) {
    var letters = { "İ": "i", "I": "i", "Ş": "ş", "Ğ": "ğ", "Ü": "ü", "Ö": "ö", "Ç": "ç", "ı": "i" };
    str = str.replace(/(([İIŞĞÜÇÖı]))/g, function (letter) { return letters[letter]; })
    return str.toLowerCase();
}

function searchHtml(container, filterElement, searchText) {
    var $doms = $('#' + container + ' ' + filterElement);
    searchText = turkishToLower(searchText);

    var val = '^(?=.*' + $.trim(searchText).split(/\s+/).join(')(?=.*\\b') + ').*$';
    var reg = RegExp(val, 'i');
    var text;
    var headerRow = 0;

    $doms.show().filter(function () {
        text = $(this).text().replace(/\s+/g, ' ');
        if (headerRow == 0) {
            headerRow = 1;
            return false;
        }
        return !reg.test(turkishToLower(text));
    }).hide();
}

function displayAll(elements, cleanDom) {
    var $doms = $('#' + elements);

    $doms.filter(function () {
        $(this).show();
    });
    if ($('#' + cleanDom).length > 0) {
        $('#' + cleanDom).val("");
    }
}