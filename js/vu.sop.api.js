/*

Descripcion: Esta libreria se de las llamadas al api de onboarding

 */


if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.sop == "undefined") { vu.sop = function() {} }

if (typeof vu.sop.api == "undefined") { vu.sop.api = function() {} }

vu.sop.api.host = 'https://om-presales2.vusecurity.solutions/vu-onboarding-rest'
vu.sop.api.headers = {
    'authorization': '93c2cca7-8e89-4dff-aef4-f3bcb6930ba9'
  };

vu.sop.api.imgData2b64 = function(img){
    return img.split(",")[1]
}
//------------------------------------------------------------------------------

vu.sop.api.toSelfieList = function(selfieList, typeImageList){
    var selfieArray = [];
    for(var i in selfieList) {
       var item = selfieList[i];
       var typeItem = typeImageList[i];
       selfieArray.push({
            "file" : item.split(",")[1],
            "imageType"  : typeItem
        });
    }
    console.log(selfieArray);
    return selfieArray
}

//------------------------------------------------------------------------------

vu.sop.api.newOperation = function(userName, browserInfo){
    url = vu.sop.api.host + '/onboarding/newOperation'
    body = {
        "userName": userName,
    }
    if(browserInfo != undefined && browserInfo != null) {
        body.operationSystem = browserInfo.operatingSystem;
        body.operativeSystemVersion = browserInfo.operatingSystemVersion;
        body.deviceName = browserInfo.mobileModel;
        body.deviceManufacture = browserInfo.browserName + " - " + browserInfo.browserVersion;
    }

    if(vu.sop.enableTelemetry){
        body.captureLogTraceId = vu.telemetry.traceId;
    }

    return vu.sop.api.doBodyIntegrity(url, JSON.stringify(body), "application/json", userName)
}

//------------------------------------------------------------------------------

vu.sop.api.addFront = function(userName, operationId, operationGuid, image) {
    url = vu.sop.api.host + '/onboarding/addFront'
    body = {
        "operationId": operationId,
        "userName": userName,
        "analyzeOcr": "true",
        "analyzeAnomalies": "true",
        "file": vu.sop.api.imgData2b64(image)
    }
    if(operationGuid != undefined && operationGuid != null) {
        body.operationGuid = operationGuid;
    }
    return vu.sop.api.doBodyIntegrity(url, JSON.stringify(body), "application/json", userName)
}

//------------------------------------------------------------------------------

vu.sop.api.addBack = function(userName, operationId, operationGuid, image) {
    url = vu.sop.api.host + '/onboarding/addBack'
    body = {
        "operationId": operationId,
        "userName": userName,
        "analyzeOcr": "true",
        "analyzeAnomalies": "true",
        "file": vu.sop.api.imgData2b64(image)
    }
    if(operationGuid != null) {
        body.operationGuid = operationGuid;
    }
    return vu.sop.api.doBodyIntegrity(url, JSON.stringify(body), "application/json", userName)
}

//------------------------------------------------------------------------------

vu.sop.api.addDocumentImage = function(userName, operationId, operationGuid, image) {
    url = vu.sop.api.host + '/onboarding/addDocumentImage'
    body = {
        "operationId": operationId,
        "userName": userName,
        "file": vu.sop.api.imgData2b64(image)
    }
    if(operationGuid != null) {
        body.operationGuid = operationGuid;
    }
    return vu.sop.api.doBodyIntegrity(url, JSON.stringify(body), "application/json", userName)
}

//------------------------------------------------------------------------------


// REquiere API PRIVADA
vu.sop.api.getDocumentInformation = function(userName, operationId, operationGuid) {
    url = vu.sop.api.host + '/onboarding/getDocumentInformation'
    body = {
        "operationId": operationId,
        "userName": userName,
    }
    if(operationGuid != null) {
        body.operationGuid = operationGuid;
    }
    return vu.sop.api.doBodyIntegrity(url, JSON.stringify(body), "application/json", userName)
}


//------------------------------------------------------------------------------

vu.sop.api.addBarcode = function(userName, operationId, operationGuid, barcodeData, barcodeExtraData) {
    url = vu.sop.api.host + '/onboarding/addBarcode'
    body ={
        "operationId": operationId,
        "userName": userName,
        "document": barcodeData,
        "data": barcodeExtraData
    }
    if(operationGuid != null) {
        body.operationGuid = operationGuid;
    }
    return vu.sop.api.doBodyIntegrity(url, JSON.stringify(body), "application/json", userName)
}

//------------------------------------------------------------------------------

vu.sop.api.register = function(userName, operationId, operationGuid, image) {
    url = vu.sop.api.host + '/onboarding/register'
    body = {
        "operationId": operationId,
        "userName": userName,
        "selfieList": [{"file": vu.sop.api.imgData2b64(image), "imageType": "SN"}]
    }
    if(operationGuid != null) {
        body.operationGuid = operationGuid;
    }
    return vu.sop.api.doBodyIntegrity(url, JSON.stringify(body), "application/json", userName)
}

//------------------------------------------------------------------------------

vu.sop.api.registers = function(userName, operationId, operationGuid, images, gestures) {
	vu.sop.api.toSelfieList(images,gestures);
	url = vu.sop.api.host + '/onboarding/register'
    body = {
        "operationId": operationId,
        "userName": userName,
        "selfieList": vu.sop.api.toSelfieList(images,gestures)
    }
    if(operationGuid != null) {
        body.operationGuid = operationGuid;
    }
    return vu.sop.api.doBodyIntegrity(url, JSON.stringify(body), "application/json", userName)
}

//------------------------------------------------------------------------------

vu.sop.api.endOperation = function(userName, operationId, operationGuid) {
    url = vu.sop.api.host + '/onboarding/endOperation'
    body = {
        "operationId": operationId,
        "userName": userName
    }
    if(operationGuid != null) {
        body.operationGuid = operationGuid;
    }
    return vu.sop.api.doBodyIntegrity(url, JSON.stringify(body), "application/json", userName)
}

//------------------------------------------------------------------------------

vu.sop.api.faceLogin = function(userName, image) {
    url = vu.sop.api.host + '/face/login'
    body = {
        "userName": userName,
        "selfieList": [{"file": vu.sop.api.imgData2b64(image), "imageType": "SN"}]
    }
    return vu.sop.api.doBodyIntegrity(url, JSON.stringify(body), "application/json", userName)
}

//------------------------------------------------------------------------------

vu.sop.api.faceLoginList = function(userName, images, gestures) {
    url = vu.sop.api.host + '/face/login'
    body = {
        "userName": userName,
        "selfieList": vu.sop.api.toSelfieList(images,gestures)
    }
    return vu.sop.api.doBodyIntegrity(url, JSON.stringify(body), "application/json", userName)
}

//------------------------------------------------------------------------------

vu.sop.api.faceRegister = function(userName, image) {
    url = vu.sop.api.host + '/face/register'
    body = {
        "userName": userName,
        "selfieList": [{"file": vu.sop.api.imgData2b64(image), "imageType": "SN"}]
    }
    return vu.sop.api.doAjaxRequest(url, JSON.stringify(body), "application/json")
}

//------------------------------------------------------------------------------

vu.sop.api.faceRegisters = function(userName, images, gestures) {
    url = vu.sop.api.host + '/face/register'
    body = {
        "userName": userName,
        "selfieList": vu.sop.api.toSelfieList(images,gestures)
    }
    return vu.sop.api.doBodyIntegrity(url, JSON.stringify(body), "application/json", userName)
}

//------------------------------------------------------------------------------

vu.sop.api.addVideo = function(userName, operationId, operationGuid, video) {
    url = vu.sop.api.host + '/onboarding/addVideos'
    var formData = new FormData();
    formData.append("operationId", operationId);
    formData.append("userName", userName);
    formData.append("VSS", video, "videoPruebaVida.mp4");
    if(operationGuid != null) {
        formData.append("operationGuid",  operationGuid);
    }

    var settings = {
                "url": url,
                "method": "POST",
                "timeout": 0,
                "headers": vu.sop.api.headers,
                "processData": false,
                "mimeType": "multipart/form-data",
                "contentType": false,
                "data": formData
              };

            let promesa;
            return $.ajax(settings).done(function (promesa) {
                console.log(promesa);
            });

    return promesa;
}

//------------------------------------------------------------------------------

vu.sop.api.addVideos = async function(userName, operationId, operationGuid, video) {
    url = vu.sop.api.host + '/onboarding/addVideos'
    let answer;

        var formData = new FormData();
        formData.append("operationId", operationId);
        formData.append("userName", userName);
        formData.append("VSS", video, "videoPruebaVida.mp4");
        if(operationGuid != null) {
            formData.append("operationGuid",  operationGuid);
        }

    return vu.sop.api.doBodyIntegrityAddVideo(userName, operationId, operationGuid, formData, 'multipart/form-data', url);
}


//------------------------------------------------------------------------------

vu.sop.api.doAjaxRequest = function(url, body, contentType) {
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


        const encoder = new TextEncoder();
        const data = encoder.encode(body);
        crypto.subtle.digest('SHA-256', data).then(function (hashBuffer) {
            hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
            hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
            xhr.setRequestHeader("Hash", hashHex);
            xhr.send(body);
        });
    })
    return promise;
};

//------------------------------------------------------------------------------

vu.sop.api.doBodyIntegrity = async function(url, body, contentType, username) {
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

        let salt = '';

         Object.entries(vu.sop.api.headers).forEach(([key, value]) => {
            if(key === 'salt'){
                salt = value;
            }else{
                xhr.setRequestHeader(key, value);
            }
         });


       const encoder = new TextEncoder();
       let secret = salt + username;
       const secretEncode = encoder.encode(secret);
       const bodyenc =  encoder.encode(body);

        crypto.subtle.importKey(
          "raw",
          secretEncode,
          { name: "HMAC", hash: { name: "SHA-512" } },
          false,
          ["sign"]
        )
        .then((importedKey) => {
          // Calcular el MAC
          crypto.subtle.sign("HMAC", importedKey, bodyenc)
          .then((mac) => {

            if(contentType != null && contentType != "" ) {
                xhr.setRequestHeader("Content-type", contentType);
            }
            hashArray = Array.from(new Int8Array(mac));// convert buffer to byte array
            hashHex = Array.from(hashArray , byte => (byte & 0xFF).toString(16).padStart(2, '0')).join('');// convert bytes to hex string

            if(hashHex != null && hashHex != "" ) {
                xhr.setRequestHeader("X-Signature", hashHex);
            }
            xhr.send(body);
          })
          .catch((error) => console.error(error));
        })
        .catch((error) => console.error(error));
    })
    return promise;
};

//------------------------------------------------------------------------------

vu.sop.api.doBodyIntegrityAddVideo = function (userName, operationId, operationGuid, formData, contentType, url) {
    let salt = '';
    var auxHeader = {};

    Object.entries(vu.sop.api.headers).forEach(([key, value]) => {
        if (key === 'salt') {
            salt = value;
        } else {
            auxHeader[key] = value;
        }
    });

    return new Promise((resolve, reject) => {

    const plainFormDataWithoutFile = formDataToObjectExcludingField(formData, "VSS");
    const formDataJsonString = JSON.stringify(plainFormDataWithoutFile);
    const video = formData.get("VSS");

    let secret = salt + userName;

    calculateHMAC(secret, video)
        .then((hashHexFile) => {
            calculateHMAC(secret, formDataJsonString)
            .then((hashHexJsonString) => {
                const hashes = {
                    file: hashHexFile,
                    jsonString: hashHexJsonString,
                };

                auxHeader["X-Signature"] = Object.values(hashes).join('');

                let settings = {
                    "url": url,
                    "method": "POST",
                    "timeout": 0,
                    "headers": auxHeader,
                    "processData": false,
                    "mimeType": contentType,
                    "contentType": false,
                    "data": formData
                };

                $.ajax(settings)
                .done((data) => {
                    console.log(data)
                        resolve(data);
                    })
                    .fail((error) => {
                        console.error('Request error:', error.responseText);
                        reject(error);
                     });
                })
                .catch((error) => {
                    console.error('Error calculating HMAC from JSON:', error.responseText);
                });
        })
        .catch((error) => {
            console.error('Error calculating the HMAC of the file:', error.responseText);
        });
    });
}


function formDataToObjectExcludingField(formData, fieldToExclude) {
    const entries = Array.from(formData.entries()).filter(([name]) => name !== fieldToExclude);
    return Object.fromEntries(entries);
}

function calculateHMAC(secret, dataToHash) {
    return new Promise((resolve, reject) => {
        const encoder = new TextEncoder();
        if (typeof dataToHash === 'string') {
            const dataToHashArray = encoder.encode(dataToHash);
            calculateHMACFromArrayBuffer(encoder.encode(secret), dataToHashArray)
                .then(resolve)
                .catch(reject);
        } else if (dataToHash instanceof File) {

            const reader = new FileReader();

            reader.onload = function (event) {
                const fileData = event.target.result;
                calculateHMACFromArrayBuffer(encoder.encode(secret), fileData)
                    .then(resolve)
                    .catch(reject);
            };

            reader.onerror = function (error) {
                reject(error);
            };

            reader.readAsArrayBuffer(dataToHash);
        } else {
            reject(new Error('Unsupported data type'));
        }
    });
}

function calculateHMACFromArrayBuffer(secret, data) {
    return crypto.subtle.importKey(
        "raw",
        secret,
        { name: "HMAC", hash: { name: "SHA-512" } },
        false,
        ["sign"]
    )
        .then((importedKey) => {
            return crypto.subtle.sign("HMAC", importedKey, data)
                .then((mac) => {
                    const hashArray = Array.from(new Int8Array(mac));
                    const hashHex = Array.from(hashArray, byte => (byte & 0xFF).toString(16).padStart(2, '0')).join('');
                    return hashHex;
                });
        });
}