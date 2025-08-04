const url = new URL(location.href).searchParams.get("url");
const iframe = document.getElementById("iframe");
iframe.src = url;
