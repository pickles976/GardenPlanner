export function setDefaultCursor() {
    document.getElementsByTagName("body")[0].style.cursor = "auto";
}

export function setCrossCursor() {
    document.getElementsByTagName("body")[0].style.cursor = "url('/cross_black.cur'), auto";
}