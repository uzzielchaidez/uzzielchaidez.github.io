if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.sop == "undefined") { vu.sop = function() {} }

if (typeof vu.sop.logApi == "undefined") { vu.sop.logApi = function() {} }

vu.sop.logApi.host = "https://om-presales2.vusecurity.solutions/vu_onboarding_log_rest";
vu.sop.api.headers = {
    'authorization': 'd74ac1ee-bd14-4b41-8a67-674849fbc3b5'
  };

//------------------------------------------------------------------------------

vu.sop.logApi.initTraceTransaction = function(logEntry){
    url = vu.sop.logApi.host + '/transaction/init'
    body = JSON.stringify(logEntry)

    return vu.sop.logApi.doAjaxRequest(url, body, "application/json");
}

//------------------------------------------------------------------------------

vu.sop.logApi.saveDocumentLog = function(logEntry){
    url = vu.sop.logApi.host + '/document/saveLog'
    body = JSON.stringify(logEntry)

    return vu.sop.logApi.doAjaxRequest(url, body, "application/json");
}

//------------------------------------------------------------------------------

vu.sop.logApi.saveSelfieLog = function(logEntry){
    url = vu.sop.logApi.host + '/selfie/saveLog'
    body = JSON.stringify(logEntry)

    return vu.sop.logApi.doAjaxRequest(url, body, "application/json");
}

//------------------------------------------------------------------------------


vu.sop.logApi.doAjaxRequest = function(url, body, contentType) {
    let promise = new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const resp = xhr.responseText;
                    try {
                        const respJson = JSON.parse(resp);
                        resolve(respJson);
                    } catch (e) {
                        reject(resp);
                    }
                } else {
                    const resp = xhr.responseText;
                    try {
                        const respJson = JSON.parse(resp);
                        reject(respJson);
                    } catch (e) {
                        reject(resp);
                    }
                }
            } else {
                //console.log("xhr processing going on");
            }
        };
        xhr.open("POST", url, true);

        Object.entries(vu.sop.api.headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);

        });
        if(contentType != null && contentType != "" ) {
            xhr.setRequestHeader("Content-type", contentType);
        }
        xhr.send(body);
    })
    return promise;
};

vu.sop.logApi.doFetchRequest = function(data , path) {

    vu.sop.api.headers["Content-Type"] = "application/json";

    fetch(vu.sop.logApi.host + path, {
        method: "POST",
        keepalive: true,
        headers: vu.sop.api.headers,
        body: JSON.stringify(data),
    });
}