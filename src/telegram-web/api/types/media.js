// We cache avatars as Data URI for faster initial load
// and messages media as Blob for smaller size.
export var ApiMediaFormat;
(function (ApiMediaFormat) {
    ApiMediaFormat[ApiMediaFormat["BlobUrl"] = 0] = "BlobUrl";
    ApiMediaFormat[ApiMediaFormat["Progressive"] = 1] = "Progressive";
    ApiMediaFormat[ApiMediaFormat["DownloadUrl"] = 2] = "DownloadUrl";
    ApiMediaFormat[ApiMediaFormat["Text"] = 3] = "Text";
})(ApiMediaFormat || (ApiMediaFormat = {}));
