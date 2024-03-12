/*
https://github.com/Sec-ant/zxing-wasm

- Templates prioridad
    - Colombia
    - Argentina [DONE]
    - Ecuador
    - Venezuela
    - Paraguay
    - Panama
    - Costa rica

 */

if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.sop == "undefined") { vu.sop = function() {} }

if (typeof vu.sop.barcode == "undefined") { vu.sop.barcode = function() {} }

if (typeof vu.sop.barcode.ui == "undefined") { vu.sop.barcode.ui = function() {} }

// Solo agregar cuando este implementado el parser.
vu.sop.barcode.expectedBarcodes = {
    "VU-ARG-ID-01": ["PDF417"],
    "VU-ARG-ID-02": ["PDF417"],
    "VU-ARG-ID-03": ["PDF417"],
    "VU-ARG-ID-04": ["PDF417"],
    "VU-COL-ID-01": ["PDF417"],
    "VU-COL-IDF-01": ["PDF417"],
}

vu.sop.barcode.readerOptions = function() {
    return ZXingWASM.ReaderOptions = {
        tryHarder: true,
        tryInvert: true,
        tryRotate: true,
        tryDownscale: true,
    };
}

/* ------------------------------------------------------------------------------------------------------------------ */

vu.sop.barcode.canvas = null
vu.sop.barcode.canvasContext = null
vu.sop.barcode.loadPromise = null;
vu.sop.barcode.load = async function(basePath) {
    await vu.sop.loadJs(basePath + '/js/libs/zxing-wasm/index.js');
    return ZXingWASM.getZXingModule({
        locateFile: (path, prefix) => {
            if (path.endsWith(".wasm")) {
                return basePath + '/js/libs/zxing-wasm/'  + `${path}`;
            }
            return prefix + path;
        }
    });
}

vu.sop.barcode.loop = async function() {
    if (vu.sop.barcode.canvas === null) {
        vu.sop.barcode.canvas = document.createElement('canvas');
        vu.sop.barcode.canvasContext = vu.sop.barcode.canvas.getContext("2d", { willReadFrequently: true });
        vu.sop.barcode.canvas.width = vu.camera.video.videoWidth;
        vu.sop.barcode.canvas.height = vu.camera.video.videoHeight;
    }

    vu.sop.barcode.canvasContext.drawImage(vu.camera.video, 0, 0,
        vu.sop.barcode.canvas.width, vu.sop.barcode.canvas.height);
    let imageData = vu.sop.barcode.canvasContext.getImageData(0, 0,
        vu.sop.barcode.canvas.width, vu.sop.barcode.canvas.height);

    let result = await ZXingWASM.readBarcodesFromImageData(
        imageData,
        vu.sop.barcode.readerOptions(),
    );

    if (result.length > 0) {
        vu.sop.barcode.loop = false;
        console.log("Barcode result found. Resolving...")

        vu.sop.barcode.ui.overlay.style.display = 'none'
        await vu.sop.ui.hideBottomText();
        await vu.sop.ui.bottomTextAlert.hide();

        resultByType = {}
        for (let step = 0; step < result.length; step++) {
            resultByType[result[step].format] = result[step].text;
        }

        // Scan en la pantalla de ADD DOCUMENT (front/back)
        if (vu.sop.documentId === null){
            vu.sop.barcode.ui.resolve(resultByType);
            return;
        }

        VUId = vu.sop.documentCodes.getVUIdFromId(vu.sop.documentId)
        resultParsed = vu.sop.barcode.parse(resultByType, VUId)

        mainData = {
            "number": "",
            "gender": "",
            "names": "",
            "lastNames": "",
            "birthdate": ""
        }
        // number
        if (resultParsed.hasOwnProperty("number")) {
            mainData["number"] = resultParsed.number;
            delete resultParsed.number;
        }
        // gender
        if (resultParsed.hasOwnProperty("gender")) {
            mainData["gender"] = resultParsed.gender;
            delete resultParsed.gender;
        } else if (resultParsed.hasOwnProperty("sex")) {
            mainData["gender"] = resultParsed.sex;
            delete resultParsed.sex;
        }
        // names
        if (resultParsed.hasOwnProperty("names")) {
            mainData["names"] = resultParsed.names;
            delete resultParsed.names;
        }
        // lastNames
        if (resultParsed.hasOwnProperty("lastNames")) {
            mainData["lastNames"] = resultParsed.lastNames;
            delete resultParsed.lastNames;
        } else if (resultParsed.hasOwnProperty("surname")) {
            mainData["lastNames"] = resultParsed.surname;
            delete resultParsed.surname;
        }
        // birthdate
        if (resultParsed.hasOwnProperty("birthdate")) {
            mainData["birthdate"] = resultParsed.birthdate;
            delete resultParsed.birthdate;
        } else if (resultParsed.hasOwnProperty("dateOfBirth")) {
            mainData["birthdate"] = resultParsed.dateOfBirth;
            delete resultParsed.dateOfBirth;
        }

        // ------------------------------------------------------------------------------------------------------------
        // Date Transformations
        if (mainData.hasOwnProperty("birthdate")) {
            mainData.birthdate = mainData.birthdate["year"] +
                vu.sop.barcode.padWithLeadingZeros(mainData.birthdate["month"], 2) +
                vu.sop.barcode.padWithLeadingZeros(mainData.birthdate["day"], 2);
        }
        if (resultParsed.hasOwnProperty("expeditionDate")) {
            resultParsed.expeditionDate = resultParsed.expeditionDate["year"] +
                vu.sop.barcode.padWithLeadingZeros(resultParsed.expeditionDate["month"], 2) +
                vu.sop.barcode.padWithLeadingZeros(resultParsed.expeditionDate["day"], 2);
        }
        if (resultParsed.hasOwnProperty("expirationDate")) {
            resultParsed.expirationDate = resultParsed.expirationDate["year"] +
                vu.sop.barcode.padWithLeadingZeros(resultParsed.expirationDate["month"], 2) +
                vu.sop.barcode.padWithLeadingZeros(resultParsed.expirationDate["day"], 2);
        }

        // Mandar el raw
        //resultParsed["raw"] = resultByType;

        console.log([mainData, resultParsed])
        vu.sop.barcode.ui.resolve([mainData, resultParsed]);
    } else {
        console.log("No barcode found. Looping...")
        setTimeout(vu.sop.barcode.loop, 10);
    }
}

vu.sop.barcode.padWithLeadingZeros = function(num, totalLength) {
  return String(num).padStart(totalLength, '0');
}


/* --------------------- */

//vu.sop.barcode.ui.overlay = document.getElementById("vu.sop.barcode.ui.overlay");
vu.sop.barcode.ui.overlay = null;
vu.sop.barcode.ui.overlayColor = "#343434";
vu.sop.barcode.ui.overlay0pacity = 0.5;

vu.sop.barcode.ui.overlaySvg = function(color) { return "url('data:image/svg+xml;base64," +  btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 500" xmlns:v="https://vecta.io/nano"><path d="M569.537 97.027c-3.455 0-3.094 2.257-3.084 3.252l.033 3.313c.017 1.669-.211 2.905 1.6 3.295l97.488-.012c1.75 0 3.557 1.004 4.881 2.77 1.293 1.234 2.014 2.753 2.014 4.23l-.012 96.146c.066 3.162 1.448 2.816 3.436 2.836l3.324.033c.969.01 3.128.34 3.252-2.805V107.02c0-5.237-4.76-9.992-10.002-9.992h-102.93z" style="fill:' + color  + '"/><path d="M26.87 247.144h695.086v5.657H26.87z" fill="red"/><path d="M682.451 289.573c0-3.455-2.257-3.094-3.252-3.084l-3.312.033c-1.669.017-2.905-.211-3.295 1.6l.012 97.488c0 1.75-1.004 3.557-2.77 4.881-1.234 1.293-2.753 2.014-4.23 2.014l-96.146-.012c-3.162.066-2.816 1.448-2.836 3.436l-.033 3.324c-.01.969-.34 3.128 2.805 3.252H672.46c5.237 0 9.992-4.76 9.992-10.002zM179.789 402.511c3.455 0 3.094-2.257 3.084-3.252l-.033-3.312c-.017-1.669.211-2.905-1.6-3.295l-97.488.012c-1.75 0-3.557-1.004-4.881-2.77-1.293-1.234-2.014-2.753-2.014-4.23l.012-96.146c-.066-3.162-1.448-2.816-3.436-2.836l-3.324-.033c-.969-.01-3.128-.341-3.252 2.805V392.52c0 5.237 4.76 9.992 10.002 9.992zM66.875 209.966c0 3.455 2.257 3.094 3.252 3.084l3.313-.033c1.669-.017 2.905.211 3.295-1.6l-.012-97.488c0-1.75 1.004-3.557 2.77-4.881 1.234-1.293 2.753-2.014 4.23-2.014l96.146.012c3.162-.066 2.816-1.448 2.836-3.436l.033-3.324c.01-.969.34-3.128-2.805-3.252H76.867c-5.237 0-9.992 4.76-9.992 10.002z" style="fill:' + color  + '"/></svg>') +"')"}

vu.sop.barcode.ui.resolve;
vu.sop.barcode.ui.reject;
vu.sop.barcode.ui.start = async function() {
    vu.sop.barcode.ui.overlay = document.getElementById("vu.sop.barcode.ui.overlay");
    vu.sop.barcode.ui.overlay.style.backgroundImage = vu.sop.barcode.ui.overlaySvg(vu.sop.barcode.ui.overlayColor);
    vu.sop.barcode.ui.overlay.style.opacity = vu.sop.barcode.ui.overlay0pacity

    await vu.sop.barcode.ui.showTutorial();
    vu.sop.barcode.ui.overlay.style.display = 'block'
    await vu.sop.ui.showBottomText(vu.sop.msg.readBarcode);
    await vu.sop.ui.showBottomTextAlert(vu.sop.msg.cantReadBarcode);


    let promise = new Promise(function (resolve, reject) {
        vu.sop.barcode.ui.resolve = resolve;
        vu.sop.barcode.ui.reject = reject;
    });

    vu.sop.barcode.loop()

    return promise
}


vu.sop.barcode.ui.pdf417Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPMAAABHCAIAAABdz+YLAAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw1AUhU9TpSIVh3YQcchQBcEuKuJYWrEIFkpboVUHk5f+QZOGJMXFUXAtOPizWHVwcdbVwVUQBH9AnB2cFF2kxPuSQosYLzzex3n3HN67DxBaNaaafTFA1Swjk4yL+cKqGHiFD36EEMGkxEw9lV3MwbO+7qmb6i7Ks7z7/qwhpWgywCcSx5huWMQbxHObls55nzjMKpJCfE48ZdAFiR+5Lrv8xrnssMAzw0YukyAOE4vlHpZ7mFUMlXiWOKKoGuULeZcVzluc1VqDde7JXxgsaitZrtMaQxJLSCENETIaqKIGC1HaNVJMZOg87uEfdfxpcsnkqoKRYwF1qJAcP/gf/J6tWZqZdpOCcaD/xbY/xoHALtBu2vb3sW23TwD/M3Cldf31FjD/SXqzq0WOgOFt4OK6q8l7wOUOMPKkS4bkSH5aQqkEvJ/RNxWA0C0wuObOrXOO0wcgR7NavgEODoGJMmWve7x7oHdu//Z05vcDtz5ywmt0Wf8AAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfoAQMTJTmwgPDXAAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAAbZJREFUeNrt3dFqhDAQBVAt/v8v27dShITZmVGrPedpYdeYuJcgDjHrErbv+8/ndV0/PeRw1KS1w1Ejo9YmP2sZbLB7wT7kep64RLmxT1rrzUP9vzh89bXAG0k2kg2SDZINkg2SjWTD22yT7xIliRbBEkzwAX69qHFqMSU39nqNI9GH3IjuSpE5G3cjINkg2SDZINlINkg2PMEW/2lugUavUR/iizVuWY1SbyHen1F1Jree5Zq/z5wNko1kg2SDZINkg2SDZPNfbe0t9q6hCL55LP5SrN4FI/XSQ66oFBzgc9VTZM7G3QhINkg2SDZINpINb/PB8+zcC4cS6s8yg29aGh3S3p/nDjBxovjAT02RORt3IyDZINkg2SDZSDZINjzBrFJT32+87tQCSrBSUN8qZNLgZaOI7w0yGmAuD72DNWfjbgQkGyQbJBskGyQbyYZ3aXhHVPvj9949KOr7cuRewtS7bcjkOuRONKk3BbdM6dXeuDkbdyMg2SDZINkg2Ug2SDY8waxSc8simiW8i0W9td+Cm37Mjwqe67IL21ul+uODNWfjbgQkGyQbJBskGyQbyYYH+gbBZe1+d2ZiEAAAAABJRU5ErkJggg=="

vu.sop.barcode.ui.showTutorial = function() {
    barcodeImage = vu.sop.barcode.ui.pdf417Image
    // TODO -  Cambiar la imagen dependiendo del documento

    text = vu.sop.msg.readBarcodeTutorial + "<br><img src='" + barcodeImage + "'><br><br>"
    vu.sop.ui.showBottomText("")
    return vu.sop.ui.alert(text)
}

// ---------------------------------------------------------------------------------------------------------------------
// PARCE BARCODE
// ---------------------------------------------------------------------------------------------------------------------
/*
ARG - DONE
COL - DONE
*/

vu.sop.barcode.parse = function(rawBarcode, VUId) {
    // -----------------------------------------------------------------------------------------------------------------
    // Front
    // -----------------------------------------------------------------------------------------------------------------
    if ( VUId === "VU-ARG-ID-02" ) {
        if (rawBarcode.hasOwnProperty('PDF417')) {
            result = rawBarcode['PDF417'].split('@');
            var response = {
                "ident": result[0],
                "surname": result[1],
                "names": result[2],
                "sex": result[3],
                "number": result[4],
                "identType": result[5]
            };
            try {
                response["prefixSuffixCuil"] = result[8];
            } catch (error) {
                console.log("VU-ARG-ID-02 prefixSuffixCuil error:", error);
            }
            try {
                var date = new Date(
                    result[6].split("/")[2],
                    result[6].split("/")[1],
                    result[6].split("/")[0]);
                response["dateOfBirth"] = {
                    "day": date.getDate(),
                    "month": date.getMonth(),
                    "year": date.getFullYear()
                };
            } catch (error) {
                console.log("VU-ARG-ID-02 dateOfBirth error:", error);
            }
            try {
                var date = new Date(
                    result[7].split("/")[2],
                    result[7].split("/")[1],
                    result[7].split("/")[0]);
                response["expeditionDate"] = {
                    "day": date.getDate(),
                    "month": date.getMonth(),
                    "year": date.getFullYear()
                };
            } catch (error) {
                console.log("VU-ARG-ID-02 expeditionDate error:", error);
            }
            return response;
        } else {
            return null;
        }
    }
    if ( VUId === "VU-ARG-ID-04") {
        if (rawBarcode.hasOwnProperty('PDF417')) {
            result = rawBarcode['PDF417'].split('@');
            var response = {
                "ident": result[0],
                "surname": result[1],
                "names": result[2],
                "sex": result[3],
                "number": result[4],
                "identType": result[5]
            };
            try {
                response["prefixSuffixCuil"] = result[8];
            } catch (error) {
                console.log("VU-ARG-ID-04 prefixSuffixCuil error:", error);
            }
            try {
                var date = new Date(
                    result[6].split("/")[2],
                    result[6].split("/")[1],
                    result[6].split("/")[0]);
                response["dateOfBirth"] = {
                    "day": date.getDate(),
                    "month": date.getMonth(),
                    "year": date.getFullYear()
                };
            } catch (error) {
                console.log("VU-ARG-ID-04 dateOfBirth error:", error);
            }
            try {
                var date = new Date(
                    result[7].split("/")[2],
                    result[7].split("/")[1],
                    result[7].split("/")[0]);
                response["expeditionDate"] = {
                    "day": date.getDate(),
                    "month": date.getMonth(),
                    "year": date.getFullYear()
                };
            } catch (error) {
                console.log("VU-ARG-ID-04 expeditionDate error:", error);
            }
            return response;
        } else {
            return null;
        }
    }
    // -----------------------------------------------------------------------------------------------------------------
    if ( VUId === "VU-BOL-ID-01") {
        // TODO
    }
    if ( VUId === "VU-BOL-ID-02") {
        // TODO
    }
    if ( VUId === "VU-BOL-ID-03") {
        // TODO
    }
    if ( VUId === "VU-ECU-ID-01") {
        // TODO
    }
    if ( VUId === "VU-TTO-DL-01") {
        // TODO
    }


    // -----------------------------------------------------------------------------------------------------------------
    // Back
    if ( VUId === "VU-ARG-ID-01" ) {
        if (rawBarcode.hasOwnProperty('PDF417')) {
            result = rawBarcode['PDF417'].split('@');
            response = {
                "surname": result[4],
                "names": result[5],
                "sex": result[8],
                "number": result[1],
                "dateOfBirth": result[7],
                "expirationDate": result[12],
                "expeditionDate": result[9],
                "nationality":result[6],
                "identType": result[2],
                "ident": result[10],
                "identCode": result[11]
            }
            try {
                var date = new Date(
                    result[7].split("/")[2],
                    result[7].split("/")[1],
                    result[7].split("/")[0]);
                response["dateOfBirth"] = {
                    "day": date.getDate(),
                    "month": date.getMonth(),
                    "year": date.getFullYear()
                };
            } catch (error) {
                console.log("VU-ARG-ID-01 dateOfBirth error:", error);
            }
            try {
                var date = new Date(
                    result[9].split("/")[2],
                    result[9].split("/")[1],
                    result[9].split("/")[0]);
                response["expeditionDate"] = {
                    "day": date.getDate(),
                    "month": date.getMonth(),
                    "year": date.getFullYear()
                };
            } catch (error) {
                console.log("VU-ARG-ID-01 expeditionDate error:", error);
            }
            try {
                var date = new Date(
                    result[12].split("/")[2],
                    result[12].split("/")[1],
                    result[12].split("/")[0]);
                response["expirationDate"] = {
                    "day": date.getDate(),
                    "month": date.getMonth(),
                    "year": date.getFullYear()
                };
            } catch (error) {
                console.log("VU-ARG-ID-01 expirationDate error:", error);
            }
            return response;
        } else {
            return null;
        }
    }
    if ( VUId === "VU-ARG-ID-03" ) {
        if (rawBarcode.hasOwnProperty('PDF417')) {
            result = rawBarcode['PDF417'].split('@');
            response = {
                "surname": result[4].trim(),
                "names": result[5].trim(),
                "sex": result[8].trim(),
                "number": result[1].trim(),
                "identType": result[2].trim(),
                "prefixSuffixCuil": result[8].trim()
            }
            try {
                var date = new Date(
                    result[7].split("/")[2],
                    result[7].split("/")[1],
                    result[7].split("/")[0]);
                response["dateOfBirth"] = {
                    "day": date.getDate(),
                    "month": date.getMonth(),
                    "year": date.getFullYear()
                };
            } catch (error) {
                console.log("VU-ARG-ID-03 dateOfBirth error:", error);
            }
            try {
                response["expeditionDate"] = {
                    "day": parseInt(result[9].split("/")[0]),
                    "month": parseInt(result[9].split("/")[1]),
                    "year": parseInt(result[9].split("/")[2])
                };
            } catch (error) {
                console.log("VU-ARG-ID-03 expeditionDate error:", error);
            }
            return response;
        }
    }
    if ( VUId === "VU-CHL-ID-01" ) {
        // TODO
    }
    if ( VUId === "VU-CHL-ID-02" ) {
        // TODO
    }
    if ( VUId === "VU-COL-ID-01" ) {
        try {
            var barcode = vu.sop.barcode.colombiaParseBarcode1(rawBarcode);
        } catch (error) {
            console.log("VU-COL-ID-01 barcode 1 error:", error);
        }
        if (barcode.hasOwnProperty("dateOfBirth")) {
            if (vu.sop.barcode.checkValidDate(barcode["dateOfBirth"])) {
                return barcode;
            }
        }
    }
    if ( VUId === "VU-COL-IDF-01" ) {
        if (rawBarcode.hasOwnProperty('PDF417')) {
            var raw = rawBarcode['PDF417'];
            raw = raw.replace(/\0/g, ' ')
            expectedResult = {
                "afisCode": raw.substring(2, 12).trim(),
                "identType": raw.substring(12, 32).trim(),
                "number": parseInt(raw.substring(34, 52).trim()).toString(),
                "surname": raw.substring(52, 82).trim() + " " + raw.substring(82, 112).trim(),
                "names": raw.substring(112, 192).trim(),
                "dateOfBirth": {
                  "day": parseInt(raw.substring(198, 200).trim()),
                  "month": parseInt(raw.substring(196, 198).trim()),
                  "year": parseInt(raw.substring(192, 196).trim())
                },
                "gender": raw.substring(200, 201).trim(),
                "expeditionDate": {
                  "day": parseInt(raw.substring(207, 209).trim()),
                  "month": parseInt(raw.substring(205, 207).trim()),
                  "year": parseInt(raw.substring(201, 205).trim())
                },
                "expirationDate": {
                  "day": parseInt(raw.substring(215, 217).trim()),
                  "month": parseInt(raw.substring(213, 215).trim()),
                  "year": parseInt(raw.substring(209, 213).trim())
                },
                "bloodType": raw.substring(217, 220).trim(),
                "nationality": raw.substring(220, 250).trim(),
            }
            console.log(expectedResult)
            return expectedResult
        }
    }
    if ( VUId === "VU-DOM-ID-01" ) {
        // TODO
    }
    if ( VUId === "VU-HND-ID-01" ) {
        // TODO
    }
    if ( VUId === "VU-PAN-ID-01" ) {
        // TODO
    }
    if ( VUId === "VU-PAN-ID-02" ) {
        // TODO
    }
    if ( VUId === "VU-PAN-ID-03" ) {
        // TODO
    }
    if ( VUId === "VU-PAN-IDF-02" ) {
        // TODO
    }
    if ( VUId === "VU-PER-ID-01" ) {
        // TODO
    }
    if ( VUId === "VU-PER-ID-02" ) {
        // TODO
    }
    if ( VUId === "VU-PER-ID-03" ) {
        // TODO
    }
    if ( VUId === "VU-PER-IDF-01" ) {
        // TODO
    }
    if ( VUId === "VU-PRY-ID-01" ) {
        // TODO
    }
    if ( VUId === "VU-SLV-ID-01" ) {
        // TODO
    }
    if ( VUId === "VU-SLV-ID-02" ) {
        // TODO
    }
    if ( VUId === "VU-TTO-DL-02" ) {
        // TODO
    }
    if ( VUId === "VU-URY-ID-01" ) {
        // TODO
    }
    if ( VUId === "VU-URY-ID-03" ) {
        // TODO
    }

    return null;
}


// Colombia Helpers ----------------------------------------------------------------------------------------------------


vu.sop.barcode.colombiaParseBarcode1 = function(result) {
    // TODO - TEST!
    if (result.hasOwnProperty('PDF417')) {
        var raw = result['PDF417'];
        raw = raw.replace(/\0/g, ' ')
        var parsed = {};

        parsed["afisCode"] = raw.slice(2, 10).trim();
        parsed["fingerCard"] = raw.slice(40, 48).trim();
        parsed["names"] = (raw.slice(104, 127).trim().replace('\x00', '') + ' ' + raw.slice(127, 150).trim().replace('\x00', '')).trim();
        parsed["surname"] = (raw.slice(58, 80).trim().replace('\x00', '') + ' ' + raw.slice(81, 104).trim().replace('\x00', '')).trim();
        parsed["number"] = raw.slice(48, 58).trim().replace('\x00', '');
        parsed["bloodType"] = raw.slice(166, 169).replace('\x00', '').trim();
        parsed["dateOfBirth"] = {
            "day": parseInt(raw.slice(158, 160).trim()),
            "month": parseInt(raw.slice(156, 158).trim()),
            "year": parseInt(raw.slice(152, 156).trim())
        };
        parsed["gender"] = raw.slice(151, 152).trim();
        var department_municipality = vu.sop.barcode.colombiaGetLocalities(raw.slice(162, 165).trim(), raw.slice(160, 162).trim());
        parsed["department"] = department_municipality[0];
        parsed["municipality"] = department_municipality[1];

        return parsed;
    }
    return result;
}

vu.sop.barcode.checkValidDate = function(dateDict) {
    if ("day" in dateDict && "month" in dateDict && "year" in dateDict) {
        let validDay = false;
        let validMonth = false;
        let validYear = false;
        try {
            if (dateDict["day"] < 32 && dateDict["day"] > 0) {
                validDay = true;
            }
            if (dateDict["month"] < 13 && dateDict["month"] > 0) {
                validMonth = true;
            }
            if (dateDict["year"] < 2100 && dateDict["year"] > 1900) {
                validYear = true;
            }
        } catch {
            return false;
        }
        return validDay && validMonth && validYear;
    } else {
        return false;
    }
}


vu.sop.barcode.colombiaGetLocalities = function(departamento, municipio) {
    let resultadoDepartamento = ""
    let resultadoMunicipio = ""

    for (let step = 0; step < vu.sop.barcode.colombiaLocalities.length; step++) {
        if ( vu.sop.barcode.colombiaLocalities[step][0] === municipio &&
              vu.sop.barcode.colombiaLocalities[step][1] === departamento ) {
            resultadoDepartamento = vu.sop.barcode.colombiaLocalities[step][2]
            resultadoMunicipio = vu.sop.barcode.colombiaLocalities[step][3]
        }
    }
    return [resultadoDepartamento, resultadoMunicipio]
}

vu.sop.barcode.colombiaLocalities = [
    ['01', '001', 'ANTIOQUIA', 'MEDELLIN'],
    ['01', '004', 'ANTIOQUIA', 'ABEJORRAL'],
    ['01', '007', 'ANTIOQUIA', 'ABRIAQUI'],
    ['01', '010', 'ANTIOQUIA', 'ALEJANDRIA'],
    ['01', '013', 'ANTIOQUIA', 'AMAGA'],
    ['01', '016', 'ANTIOQUIA', 'AMALFI'],
    ['01', '019', 'ANTIOQUIA', 'ANDES'],
    ['01', '022', 'ANTIOQUIA', 'ANGELOPOLIS'],
    ['01', '025', 'ANTIOQUIA', 'ANGOSTURA'],
    ['01', '028', 'ANTIOQUIA', 'ANORI'],
    ['01', '031', 'ANTIOQUIA', 'ANTIOQUIA'],
    ['01', '034', 'ANTIOQUIA', 'ANZA'],
    ['01', '035', 'ANTIOQUIA', 'APARTADO'],
    ['01', '037', 'ANTIOQUIA', 'ARBOLETES'],
    ['01', '039', 'ANTIOQUIA', 'ARGELIA'],
    ['01', '040', 'ANTIOQUIA', 'ARMENIA'],
    ['01', '043', 'ANTIOQUIA', 'BARBOSA'],
    ['01', '046', 'ANTIOQUIA', 'BELMIRA'],
    ['01', '049', 'ANTIOQUIA', 'BELLO'],
    ['01', '052', 'ANTIOQUIA', 'BETANIA'],
    ['01', '055', 'ANTIOQUIA', 'BETULIA'],
    ['01', '058', 'ANTIOQUIA', 'BOLIVAR'],
    ['01', '061', 'ANTIOQUIA', 'BURITICA'],
    ['01', '062', 'ANTIOQUIA', 'BRICE/O'],
    ['01', '064', 'ANTIOQUIA', 'CACERES'],
    ['01', '067', 'ANTIOQUIA', 'CAICEDO'],
    ['01', '070', 'ANTIOQUIA', 'CALDAS'],
    ['01', '073', 'ANTIOQUIA', 'CAMPAMENTO'],
    ['01', '076', 'ANTIOQUIA', 'CA/ASGORDAS'],
    ['01', '078', 'ANTIOQUIA', 'CARACOLI'],
    ['01', '079', 'ANTIOQUIA', 'CARAMANTA'],
    ['01', '080', 'ANTIOQUIA', 'CAREPA'],
    ['01', '082', 'ANTIOQUIA', 'CARMEN DE VIBORAL'],
    ['01', '085', 'ANTIOQUIA', 'CAROLINA'],
    ['01', '088', 'ANTIOQUIA', 'CAUCASIA'],
    ['01', '091', 'ANTIOQUIA', 'CISNEROS'],
    ['01', '094', 'ANTIOQUIA', 'COCORNA'],
    ['01', '097', 'ANTIOQUIA', 'CONCEPCION'],
    ['01', '100', 'ANTIOQUIA', 'CONCORDIA'],
    ['01', '103', 'ANTIOQUIA', 'COPACABANA'],
    ['01', '106', 'ANTIOQUIA', 'CHIGORODO'],
    ['01', '109', 'ANTIOQUIA', 'DABEIBA'],
    ['01', '112', 'ANTIOQUIA', 'DON MATIAS'],
    ['01', '115', 'ANTIOQUIA', 'EBEJICO'],
    ['01', '117', 'ANTIOQUIA', 'EL BAGRE'],
    ['01', '118', 'ANTIOQUIA', 'ENTRERRIOS'],
    ['01', '121', 'ANTIOQUIA', 'ENVIGADO'],
    ['01', '124', 'ANTIOQUIA', 'FREDONIA'],
    ['01', '127', 'ANTIOQUIA', 'FRONTINO'],
    ['01', '130', 'ANTIOQUIA', 'GIRALDO'],
    ['01', '133', 'ANTIOQUIA', 'GIRARDOTA'],
    ['01', '136', 'ANTIOQUIA', 'GOMEZ PLATA'],
    ['01', '139', 'ANTIOQUIA', 'GRANADA'],
    ['01', '140', 'ANTIOQUIA', 'GUADALUPE'],
    ['01', '142', 'ANTIOQUIA', 'GUARNE'],
    ['01', '145', 'ANTIOQUIA', 'GUATAPE'],
    ['01', '148', 'ANTIOQUIA', 'HELICONIA'],
    ['01', '150', 'ANTIOQUIA', 'HISPANIA'],
    ['01', '151', 'ANTIOQUIA', 'ITAGUI'],
    ['01', '154', 'ANTIOQUIA', 'ITUANGO'],
    ['01', '157', 'ANTIOQUIA', 'JARDIN'],
    ['01', '160', 'ANTIOQUIA', 'JERICO'],
    ['01', '163', 'ANTIOQUIA', 'LA CEJA'],
    ['01', '166', 'ANTIOQUIA', 'LA ESTRELLA'],
    ['01', '168', 'ANTIOQUIA', 'PUERTO NARE‐LA MAGDALENA'],
    ['01', '169', 'ANTIOQUIA', 'LA UNION'],
    ['01', '170', 'ANTIOQUIA', 'LA PINTADA'],
    ['01', '172', 'ANTIOQUIA', 'LIBORINA'],
    ['01', '175', 'ANTIOQUIA', 'MACEO'],
    ['01', '178', 'ANTIOQUIA', 'MARINILLA'],
    ['01', '181', 'ANTIOQUIA', 'MONTEBELLO'],
    ['01', '184', 'ANTIOQUIA', 'MURINDO'],
    ['01', '187', 'ANTIOQUIA', 'MUTATA'],
    ['01', '190', 'ANTIOQUIA', 'NARI/O'],
    ['01', '191', 'ANTIOQUIA', 'NECHI'],
    ['01', '192', 'ANTIOQUIA', 'NECOCLI'],
    ['01', '193', 'ANTIOQUIA', 'OLAYA'],
    ['01', '196', 'ANTIOQUIA', 'PE/OL'],
    ['01', '199', 'ANTIOQUIA', 'PEQUE'],
    ['01', '202', 'ANTIOQUIA', 'PUEBLORRICO'],
    ['01', '205', 'ANTIOQUIA', 'PUERTO BERRIO'],
    ['01', '206', 'ANTIOQUIA', 'PUERTO TRIUNFO'],
    ['01', '208', 'ANTIOQUIA', 'REMEDIOS'],
    ['01', '211', 'ANTIOQUIA', 'RETIRO'],
    ['01', '214', 'ANTIOQUIA', 'RIONEGRO'],
    ['01', '217', 'ANTIOQUIA', 'SABANALARGA'],
    ['01', '218', 'ANTIOQUIA', 'SABANETA'],
    ['01', '220', 'ANTIOQUIA', 'SALGAR'],
    ['01', '223', 'ANTIOQUIA', 'SAN ANDRES'],
    ['01', '226', 'ANTIOQUIA', 'SAN CARLOS'],
    ['01', '227', 'ANTIOQUIA', 'SAN FRANCISCO'],
    ['01', '229', 'ANTIOQUIA', 'SAN JERONIMO'],
    ['01', '230', 'ANTIOQUIA', 'SAN JOSE DE LA MONTA/A'],
    ['01', '231', 'ANTIOQUIA', 'SAN JUAN DE URABA'],
    ['01', '232', 'ANTIOQUIA', 'SAN LUIS'],
    ['01', '235', 'ANTIOQUIA', 'SAN PEDRO'],
    ['01', '237', 'ANTIOQUIA', 'SAN PEDRO DE URABA'],
    ['01', '238', 'ANTIOQUIA', 'SAN RAFAEL'],
    ['01', '241', 'ANTIOQUIA', 'SAN ROQUE'],
    ['01', '244', 'ANTIOQUIA', 'SAN VICENTE'],
    ['01', '247', 'ANTIOQUIA', 'SANTA BARBARA'],
    ['01', '250', 'ANTIOQUIA', 'SANTA ROSA DE OSOS'],
    ['01', '253', 'ANTIOQUIA', 'SANTO DOMINGO'],
    ['01', '256', 'ANTIOQUIA', 'SANTUARIO'],
    ['01', '259', 'ANTIOQUIA', 'SEGOVIA'],
    ['01', '262', 'ANTIOQUIA', 'SONSON'],
    ['01', '265', 'ANTIOQUIA', 'SOPETRAN'],
    ['01', '268', 'ANTIOQUIA', 'TAMESIS'],
    ['01', '270', 'ANTIOQUIA', 'TARAZA'],
    ['01', '271', 'ANTIOQUIA', 'TARSO'],
    ['01', '274', 'ANTIOQUIA', 'TITIRIBI'],
    ['01', '277', 'ANTIOQUIA', 'TOLEDO'],
    ['01', '280', 'ANTIOQUIA', 'TURBO'],
    ['01', '282', 'ANTIOQUIA', 'URAMITA'],
    ['01', '283', 'ANTIOQUIA', 'URRAO'],
    ['01', '286', 'ANTIOQUIA', 'VALDIVIA'],
    ['01', '289', 'ANTIOQUIA', 'VALPARAISO'],
    ['01', '290', 'ANTIOQUIA', 'VEGACHI'],
    ['01', '291', 'ANTIOQUIA', 'VIGIA DEL FUERTE'],
    ['01', '292', 'ANTIOQUIA', 'VENECIA'],
    ['01', '293', 'ANTIOQUIA', 'YALI'],
    ['01', '295', 'ANTIOQUIA', 'YARUMAL'],
    ['01', '298', 'ANTIOQUIA', 'YOLOMBO'],
    ['01', '300', 'ANTIOQUIA', 'YONDO‐CASABE'],
    ['01', '301', 'ANTIOQUIA', 'ZARAGOZA'],
    ['03', '001', 'ATLANTICO', 'BARRANQUILLA'],
    ['03', '004', 'ATLANTICO', 'BARANOA'],
    ['03', '007', 'ATLANTICO', 'CAMPO DE LA CRUZ'],
    ['03', '010', 'ATLANTICO', 'CANDELARIA'],
    ['03', '013', 'ATLANTICO', 'GALAPA'],
    ['03', '016', 'ATLANTICO', 'JUAN DE ACOSTA'],
    ['03', '019', 'ATLANTICO', 'LURUACO'],
    ['03', '022', 'ATLANTICO', 'MALAMBO'],
    ['03', '025', 'ATLANTICO', 'MANATI'],
    ['03', '028', 'ATLANTICO', 'PALMAR DE VARELA'],
    ['03', '031', 'ATLANTICO', 'PIOJO'],
    ['03', '034', 'ATLANTICO', 'POLONUEVO'],
    ['03', '035', 'ATLANTICO', 'PONEDERA'],
    ['03', '037', 'ATLANTICO', 'PUERTO COLOMBIA'],
    ['03', '040', 'ATLANTICO', 'REPELON'],
    ['03', '043', 'ATLANTICO', 'SABANAGRANDE'],
    ['03', '046', 'ATLANTICO', 'SABANALARGA'],
    ['03', '047', 'ATLANTICO', 'SANTA LUCIA'],
    ['03', '049', 'ATLANTICO', 'SANTO TOMAS'],
    ['03', '052', 'ATLANTICO', 'SOLEDAD'],
    ['03', '055', 'ATLANTICO', 'SUAN'],
    ['03', '058', 'ATLANTICO', 'TUBARA'],
    ['03', '061', 'ATLANTICO', 'USIACURI'],
    ['05', '001', 'BOLIVAR', 'CARTAGENA'],
    ['05', '004', 'BOLIVAR', 'ACHI'],
    ['05', '005', 'BOLIVAR', 'ARENAL'],
    ['05', '006', 'BOLIVAR', 'ALTOS DEL ROSARIO'],
    ['05', '007', 'BOLIVAR', 'ARJONA'],
    ['05', '009', 'BOLIVAR', 'ARROYO HONDO'],
    ['05', '010', 'BOLIVAR', 'BARRANCO DE LOBA'],
    ['05', '013', 'BOLIVAR', 'CALAMAR'],
    ['05', '014', 'BOLIVAR', 'CANTAGALLO'],
    ['05', '015', 'BOLIVAR', 'CICUCO'],
    ['05', '016', 'BOLIVAR', 'CORDOBA'],
    ['05', '018', 'BOLIVAR', 'CLEMENCIA'],
    ['05', '022', 'BOLIVAR', 'EL CARMEN DE BOLIVAR'],
    ['05', '025', 'BOLIVAR', 'EL GUAMO'],
    ['05', '026', 'BOLIVAR', 'HATILLO DE LOBA'],
    ['05', '027', 'BOLIVAR', 'EL PE/ON'],
    ['05', '028', 'BOLIVAR', 'MAGANGUE'],
    ['05', '031', 'BOLIVAR', 'MAHATES'],
    ['05', '037', 'BOLIVAR', 'MARGARITA'],
    ['05', '040', 'BOLIVAR', 'MARIA LA BAJA'],
    ['05', '041', 'BOLIVAR', 'MONTECRISTO'],
    ['05', '043', 'BOLIVAR', 'MOMPOS'],
    ['05', '044', 'BOLIVAR', 'MORALES'],
    ['05', '050', 'BOLIVAR', 'NOROSI'],
    ['05', '059', 'BOLIVAR', 'PINILLOS'],
    ['05', '063', 'BOLIVAR', 'REGIDOR'],
    ['05', '065', 'BOLIVAR', 'RIOVIEJO'],
    ['05', '070', 'BOLIVAR', 'SAN ESTANISLAO'],
    ['05', '072', 'BOLIVAR', 'SAN CRISTOBAL'],
    ['05', '073', 'BOLIVAR', 'SAN FERNANDO'],
    ['05', '076', 'BOLIVAR', 'SAN JACINTO'],
    ['05', '078', 'BOLIVAR', 'SAN JACINTO DEL CAUCA'],
    ['05', '079', 'BOLIVAR', 'SAN JUAN NEPOMUCENO'],
    ['05', '082', 'BOLIVAR', 'SAN MARTIN DE LOBA'],
    ['05', '084', 'BOLIVAR', 'SAN PABLO'],
    ['05', '091', 'BOLIVAR', 'SANTA CATALINA'],
    ['05', '094', 'BOLIVAR', 'SANTA ROSA'],
    ['05', '095', 'BOLIVAR', 'SANTA ROSA DEL SUR'],
    ['05', '097', 'BOLIVAR', 'SIMITI'],
    ['05', '106', 'BOLIVAR', 'SOPLAVIENTO'],
    ['05', '110', 'BOLIVAR', 'TALAIGUA NUEVO'],
    ['05', '113', 'BOLIVAR', 'TIQUISIO (PTO. RICO)'],
    ['05', '118', 'BOLIVAR', 'TURBACO'],
    ['05', '121', 'BOLIVAR', 'TURBANA'],
    ['05', '124', 'BOLIVAR', 'VILLANUEVA'],
    ['05', '127', 'BOLIVAR', 'ZAMBRANO'],
    ['07', '001', 'BOYACA', 'TUNJA'],
    ['07', '007', 'BOYACA', 'ALMEIDA'],
    ['07', '008', 'BOYACA', 'AQUITANIA (PUEBLOVIEJO)'],
    ['07', '010', 'BOYACA', 'ARCABUCO'],
    ['07', '013', 'BOYACA', 'BELEN'],
    ['07', '016', 'BOYACA', 'BERBEO'],
    ['07', '019', 'BOYACA', 'BETEITIVA'],
    ['07', '022', 'BOYACA', 'BOAVITA'],
    ['07', '025', 'BOYACA', 'BOYACA'],
    ['07', '028', 'BOYACA', 'BRICE/O'],
    ['07', '031', 'BOYACA', 'BUENAVISTA'],
    ['07', '034', 'BOYACA', 'BUSBANZA'],
    ['07', '037', 'BOYACA', 'CALDAS'],
    ['07', '040', 'BOYACA', 'CAMPOHERMOSO'],
    ['07', '043', 'BOYACA', 'CERINZA'],
    ['07', '046', 'BOYACA', 'CIENEGA'],
    ['07', '049', 'BOYACA', 'COMBITA'],
    ['07', '052', 'BOYACA', 'COPER'],
    ['07', '055', 'BOYACA', 'CORRALES'],
    ['07', '058', 'BOYACA', 'COVARACHIA'],
    ['07', '059', 'BOYACA', 'CUBARA'],
    ['07', '060', 'BOYACA', 'CUCAITA'],
    ['07', '061', 'BOYACA', 'CUITIVA'],
    ['07', '064', 'BOYACA', 'CHINAVITA'],
    ['07', '067', 'BOYACA', 'CHIQUINQUIRA'],
    ['07', '068', 'BOYACA', 'CHIQUIZA'],
    ['07', '070', 'BOYACA', 'CHISCAS'],
    ['07', '073', 'BOYACA', 'CHITA'],
    ['07', '076', 'BOYACA', 'CHITARAQUE'],
    ['07', '077', 'BOYACA', 'CHIVATA'],
    ['07', '078', 'BOYACA', 'CHIVOR'],
    ['07', '079', 'BOYACA', 'DUITAMA'],
    ['07', '082', 'BOYACA', 'EL COCUY'],
    ['07', '085', 'BOYACA', 'EL ESPINO'],
    ['07', '088', 'BOYACA', 'FIRAVITOBA'],
    ['07', '091', 'BOYACA', 'FLORESTA'],
    ['07', '094', 'BOYACA', 'GACHANTIVA'],
    ['07', '097', 'BOYACA', 'GAMEZA'],
    ['07', '100', 'BOYACA', 'GARAGOA'],
    ['07', '103', 'BOYACA', 'GUACAMAYAS'],
    ['07', '106', 'BOYACA', 'GUATEQUE'],
    ['07', '109', 'BOYACA', 'GUAYATA'],
    ['07', '112', 'BOYACA', 'GUICAN'],
    ['07', '118', 'BOYACA', 'IZA'],
    ['07', '121', 'BOYACA', 'JENESANO'],
    ['07', '124', 'BOYACA', 'JERICO'],
    ['07', '127', 'BOYACA', 'LABRANZAGRANDE'],
    ['07', '130', 'BOYACA', 'LA CAPILLA'],
    ['07', '136', 'BOYACA', 'LA UVITA'],
    ['07', '137', 'BOYACA', 'LA VICTORIA'],
    ['07', '139', 'BOYACA', 'VILLA DE LEIVA'],
    ['07', '142', 'BOYACA', 'MACANAL'],
    ['07', '148', 'BOYACA', 'MARIPI'],
    ['07', '151', 'BOYACA', 'MIRAFLORES'],
    ['07', '154', 'BOYACA', 'MONGUA'],
    ['07', '157', 'BOYACA', 'MONGUI'],
    ['07', '160', 'BOYACA', 'MONIQUIRA'],
    ['07', '161', 'BOYACA', 'MOTAVITA'],
    ['07', '163', 'BOYACA', 'MUZO'],
    ['07', '166', 'BOYACA', 'NOBSA'],
    ['07', '169', 'BOYACA', 'NUEVO COLON'],
    ['07', '173', 'BOYACA', 'OICATA'],
    ['07', '176', 'BOYACA', 'OTANCHE'],
    ['07', '178', 'BOYACA', 'PACHAVITA'],
    ['07', '179', 'BOYACA', 'PAEZ'],
    ['07', '181', 'BOYACA', 'PAIPA'],
    ['07', '184', 'BOYACA', 'PAJARITO'],
    ['07', '187', 'BOYACA', 'PANQUEBA'],
    ['07', '190', 'BOYACA', 'PAUNA'],
    ['07', '193', 'BOYACA', 'PAYA'],
    ['07', '199', 'BOYACA', 'PAZ DE RIO'],
    ['07', '202', 'BOYACA', 'PESCA'],
    ['07', '205', 'BOYACA', 'PISBA'],
    ['07', '214', 'BOYACA', 'PUERTO BOYACA'],
    ['07', '215', 'BOYACA', 'QUIPAMA'],
    ['07', '217', 'BOYACA', 'RAMIRIQUI'],
    ['07', '220', 'BOYACA', 'RAQUIRA'],
    ['07', '223', 'BOYACA', 'RONDON'],
    ['07', '226', 'BOYACA', 'SABOYA'],
    ['07', '232', 'BOYACA', 'SACHICA'],
    ['07', '235', 'BOYACA', 'SAMACA'],
    ['07', '237', 'BOYACA', 'SAN EDUARDO'],
    ['07', '238', 'BOYACA', 'SAN JOSE DE PARE'],
    ['07', '241', 'BOYACA', 'SAN LUIS DE GACENO'],
    ['07', '247', 'BOYACA', 'SAN MATEO'],
    ['07', '248', 'BOYACA', 'SAN MIGUEL DE SEMA'],
    ['07', '249', 'BOYACA', 'SAN PABLO DE BORBUR'],
    ['07', '250', 'BOYACA', 'SANTANA'],
    ['07', '251', 'BOYACA', 'SANTA MARIA'],
    ['07', '253', 'BOYACA', 'SANTA ROSA DE VITERBO'],
    ['07', '256', 'BOYACA', 'SANTA SOFIA'],
    ['07', '259', 'BOYACA', 'SATIVANORTE'],
    ['07', '262', 'BOYACA', 'SATIVASUR'],
    ['07', '265', 'BOYACA', 'SIACHOQUE'],
    ['07', '268', 'BOYACA', 'SOATA'],
    ['07', '271', 'BOYACA', 'SOCOTA'],
    ['07', '274', 'BOYACA', 'SOCHA'],
    ['07', '277', 'BOYACA', 'SOGAMOSO'],
    ['07', '280', 'BOYACA', 'SOMONDOCO'],
    ['07', '281', 'BOYACA', 'SORA'],
    ['07', '282', 'BOYACA', 'SORACA'],
    ['07', '283', 'BOYACA', 'SOTAQUIRA'],
    ['07', '286', 'BOYACA', 'SUSACON'],
    ['07', '289', 'BOYACA', 'SUTAMARCHAN'],
    ['07', '292', 'BOYACA', 'SUTATENZA'],
    ['07', '298', 'BOYACA', 'TASCO'],
    ['07', '301', 'BOYACA', 'TENZA'],
    ['07', '304', 'BOYACA', 'TIBANA'],
    ['07', '307', 'BOYACA', 'TIBASOSA'],
    ['07', '310', 'BOYACA', 'TINJACA'],
    ['07', '311', 'BOYACA', 'TIPACOQUE'],
    ['07', '313', 'BOYACA', 'TOCA'],
    ['07', '316', 'BOYACA', 'TOGUI'],
    ['07', '319', 'BOYACA', 'TOPAGA'],
    ['07', '322', 'BOYACA', 'TOTA'],
    ['07', '324', 'BOYACA', 'TUNUNGUA'],
    ['07', '325', 'BOYACA', 'TURMEQUE'],
    ['07', '328', 'BOYACA', 'TUTA'],
    ['07', '331', 'BOYACA', 'TUTAZA'],
    ['07', '334', 'BOYACA', 'UMBITA'],
    ['07', '337', 'BOYACA', 'VENTAQUEMADA'],
    ['07', '340', 'BOYACA', 'VIRACACHA'],
    ['07', '346', 'BOYACA', 'ZETAQUIRA'],
    ['09', '001', 'CALDAS', 'MANIZALES'],
    ['09', '004', 'CALDAS', 'AGUADAS'],
    ['09', '007', 'CALDAS', 'ANSERMA'],
    ['09', '013', 'CALDAS', 'ARANZAZU'],
    ['09', '022', 'CALDAS', 'BELALCAZAR'],
    ['09', '034', 'CALDAS', 'CHINCHINA'],
    ['09', '037', 'CALDAS', 'FILADELFIA'],
    ['09', '049', 'CALDAS', 'LA DORADA'],
    ['09', '052', 'CALDAS', 'LA MERCED'],
    ['09', '055', 'CALDAS', 'MANZANARES'],
    ['09', '058', 'CALDAS', 'MARMATO'],
    ['09', '061', 'CALDAS', 'MARQUETALIA'],
    ['09', '067', 'CALDAS', 'MARULANDA'],
    ['09', '076', 'CALDAS', 'NEIRA'],
    ['09', '078', 'CALDAS', 'NORCASIA'],
    ['09', '079', 'CALDAS', 'PACORA'],
    ['09', '082', 'CALDAS', 'PALESTINA'],
    ['09', '085', 'CALDAS', 'PENSILVANIA'],
    ['09', '103', 'CALDAS', 'RIOSUCIO'],
    ['09', '106', 'CALDAS', 'RISARALDA'],
    ['09', '109', 'CALDAS', 'SALAMINA'],
    ['09', '115', 'CALDAS', 'SAMANA'],
    ['09', '120', 'CALDAS', 'SAN JOSE'],
    ['09', '124', 'CALDAS', 'SUPIA'],
    ['09', '127', 'CALDAS', 'VICTORIA'],
    ['09', '130', 'CALDAS', 'VILLAMARIA'],
    ['09', '133', 'CALDAS', 'VITERBO'],
    ['11', '001', 'CAUCA', 'POPAYAN'],
    ['11', '004', 'CAUCA', 'ALMAGUER'],
    ['11', '005', 'CAUCA', 'ARGELIA'],
    ['11', '006', 'CAUCA', 'BALBOA'],
    ['11', '007', 'CAUCA', 'BOLIVAR'],
    ['11', '010', 'CAUCA', 'BUENOS AIRES'],
    ['11', '013', 'CAUCA', 'CAJIBIO'],
    ['11', '016', 'CAUCA', 'CALDONO'],
    ['11', '019', 'CAUCA', 'CALOTO'],
    ['11', '022', 'CAUCA', 'CORINTO'],
    ['11', '025', 'CAUCA', 'EL TAMBO'],
    ['11', '027', 'CAUCA', 'FLORENCIA'],
    ['11', '028', 'CAUCA', 'GUAPI'],
    ['11', '029', 'CAUCA', 'GUACHENE'],
    ['11', '031', 'CAUCA', 'INZA'],
    ['11', '034', 'CAUCA', 'JAMBALO'],
    ['11', '037', 'CAUCA', 'LA SIERRA'],
    ['11', '040', 'CAUCA', 'LA VEGA'],
    ['11', '043', 'CAUCA', 'LOPEZ (MICAY)'],
    ['11', '046', 'CAUCA', 'MERCADERES'],
    ['11', '049', 'CAUCA', 'MIRANDA'],
    ['11', '052', 'CAUCA', 'MORALES'],
    ['11', '053', 'CAUCA', 'PADILLA'],
    ['11', '055', 'CAUCA', 'PAEZ (BELALCAZAR)'],
    ['11', '058', 'CAUCA', 'PATIA (EL BORDO)'],
    ['11', '060', 'CAUCA', 'PIAMONTE'],
    ['11', '061', 'CAUCA', 'PIENDAMO'],
    ['11', '064', 'CAUCA', 'PUERTO TEJADA'],
    ['11', '067', 'CAUCA', 'PURACE (COCONUCO)'],
    ['11', '070', 'CAUCA', 'ROSAS'],
    ['11', '073', 'CAUCA', 'SAN SEBASTIAN'],
    ['11', '076', 'CAUCA', 'SANTANDER DE QUILICHAO'],
    ['11', '079', 'CAUCA', 'SANTA ROSA'],
    ['11', '082', 'CAUCA', 'SILVIA'],
    ['11', '085', 'CAUCA', 'SOTARA (PAISPAMBA)'],
    ['11', '086', 'CAUCA', 'SUCRE'],
    ['11', '087', 'CAUCA', 'SUAREZ'],
    ['11', '088', 'CAUCA', 'TIMBIO'],
    ['11', '091', 'CAUCA', 'TIMBIQUI'],
    ['11', '094', 'CAUCA', 'TORIBIO'],
    ['11', '097', 'CAUCA', 'TOTORO'],
    ['11', '098', 'CAUCA', 'VILLA RICA'],
    ['12', '001', 'CESAR', 'VALLEDUPAR'],
    ['12', '075', 'CESAR', 'AGUACHICA'],
    ['12', '150', 'CESAR', 'AGUSTIN CODAZZI'],
    ['12', '170', 'CESAR', 'ASTREA'],
    ['12', '180', 'CESAR', 'BECERRIL'],
    ['12', '200', 'CESAR', 'BOSCONIA'],
    ['12', '225', 'CESAR', 'CURUMANI'],
    ['12', '300', 'CESAR', 'CHIMICHAGUA'],
    ['12', '375', 'CESAR', 'CHIRIGUANA'],
    ['12', '410', 'CESAR', 'EL COPEY'],
    ['12', '415', 'CESAR', 'EL PASO'],
    ['12', '450', 'CESAR', 'GAMARRA'],
    ['12', '525', 'CESAR', 'GONZALEZ'],
    ['12', '600', 'CESAR', 'LA GLORIA'],
    ['12', '608', 'CESAR', 'LA JAGUA DE IBIRICO'],
    ['12', '625', 'CESAR', 'MANAURE BALCON DEL CESAR (MANA'],
    ['12', '650', 'CESAR', 'PAILITAS'],
    ['12', '700', 'CESAR', 'PELAYA'],
    ['12', '720', 'CESAR', 'PUEBLO BELLO'],
    ['12', '750', 'CESAR', 'RIO DE ORO'],
    ['12', '800', 'CESAR', 'SAN ALBERTO'],
    ['12', '825', 'CESAR', 'LA PAZ'],
    ['12', '850', 'CESAR', 'SAN DIEGO'],
    ['12', '875', 'CESAR', 'SAN MARTIN'],
    ['12', '900', 'CESAR', 'TAMALAMEQUE'],
    ['13', '001', 'CORDOBA', 'MONTERIA'],
    ['13', '004', 'CORDOBA', 'AYAPEL'],
    ['13', '007', 'CORDOBA', 'BUENAVISTA'],
    ['13', '009', 'CORDOBA', 'CANALETE'],
    ['13', '010', 'CORDOBA', 'CERETE'],
    ['13', '013', 'CORDOBA', 'CIENAGA DE ORO'],
    ['13', '014', 'CORDOBA', 'COTORRA (BONGO)'],
    ['13', '016', 'CORDOBA', 'CHIMA'],
    ['13', '019', 'CORDOBA', 'CHINU'],
    ['13', '020', 'CORDOBA', 'LA APARTADA (FRONTERA)'],
    ['13', '022', 'CORDOBA', 'LORICA'],
    ['13', '023', 'CORDOBA', 'LOS CORDOBAS'],
    ['13', '024', 'CORDOBA', 'MOMIL'],
    ['13', '025', 'CORDOBA', 'MONTELIBANO'],
    ['13', '027', 'CORDOBA', 'MO/ITOS'],
    ['13', '028', 'CORDOBA', 'PLANETA RICA'],
    ['13', '031', 'CORDOBA', 'PUEBLO NUEVO'],
    ['13', '032', 'CORDOBA', 'PUERTO LIBERTADOR'],
    ['13', '033', 'CORDOBA', 'PUERTO ESCONDIDO'],
    ['13', '034', 'CORDOBA', 'PURISIMA'],
    ['13', '037', 'CORDOBA', 'SAHAGUN'],
    ['13', '040', 'CORDOBA', 'SAN ANDRES DE SOTAVENTO'],
    ['13', '043', 'CORDOBA', 'SAN ANTERO'],
    ['13', '046', 'CORDOBA', 'SAN BERNARDO DEL VIENTO'],
    ['13', '049', 'CORDOBA', 'SAN CARLOS'],
    ['13', '052', 'CORDOBA', 'SAN JOSE DE URE'],
    ['13', '055', 'CORDOBA', 'SAN PELAYO'],
    ['13', '058', 'CORDOBA', 'TIERRALTA'],
    ['13', '060', 'CORDOBA', 'TUCHIN'],
    ['13', '061', 'CORDOBA', 'VALENCIA'],
    ['15', '004', 'CUNDINAMARCA', 'AGUA DE DIOS'],
    ['15', '007', 'CUNDINAMARCA', 'ALBAN'],
    ['15', '010', 'CUNDINAMARCA', 'ANAPOIMA'],
    ['15', '013', 'CUNDINAMARCA', 'ANOLAIMA'],
    ['15', '016', 'CUNDINAMARCA', 'ARBELAEZ'],
    ['15', '019', 'CUNDINAMARCA', 'BELTRAN'],
    ['15', '022', 'CUNDINAMARCA', 'BITUIMA'],
    ['15', '025', 'CUNDINAMARCA', 'BOJACA'],
    ['15', '029', 'CUNDINAMARCA', 'CABRERA'],
    ['15', '030', 'CUNDINAMARCA', 'CACHIPAY'],
    ['15', '031', 'CUNDINAMARCA', 'CAJICA'],
    ['15', '034', 'CUNDINAMARCA', 'CAPARRAPI'],
    ['15', '037', 'CUNDINAMARCA', 'CAQUEZA'],
    ['15', '040', 'CUNDINAMARCA', 'CARMEN DE CARUPA'],
    ['15', '043', 'CUNDINAMARCA', 'COGUA'],
    ['15', '046', 'CUNDINAMARCA', 'COTA'],
    ['15', '049', 'CUNDINAMARCA', 'CUCUNUBA'],
    ['15', '052', 'CUNDINAMARCA', 'CHAGUANI'],
    ['15', '055', 'CUNDINAMARCA', 'CHIA'],
    ['15', '058', 'CUNDINAMARCA', 'CHIPAQUE'],
    ['15', '061', 'CUNDINAMARCA', 'CHOACHI'],
    ['15', '064', 'CUNDINAMARCA', 'CHOCONTA'],
    ['15', '067', 'CUNDINAMARCA', 'EL COLEGIO'],
    ['15', '070', 'CUNDINAMARCA', 'EL PE/ON'],
    ['15', '072', 'CUNDINAMARCA', 'EL ROSAL'],
    ['15', '076', 'CUNDINAMARCA', 'FACATATIVA'],
    ['15', '079', 'CUNDINAMARCA', 'FOMEQUE'],
    ['15', '085', 'CUNDINAMARCA', 'FOSCA'],
    ['15', '088', 'CUNDINAMARCA', 'FUNZA'],
    ['15', '091', 'CUNDINAMARCA', 'FUQUENE'],
    ['15', '094', 'CUNDINAMARCA', 'FUSAGASUGA'],
    ['15', '097', 'CUNDINAMARCA', 'GACHALA'],
    ['15', '100', 'CUNDINAMARCA', 'GACHANCIPA'],
    ['15', '103', 'CUNDINAMARCA', 'GACHETA'],
    ['15', '106', 'CUNDINAMARCA', 'GAMA'],
    ['15', '109', 'CUNDINAMARCA', 'GIRARDOT'],
    ['15', '112', 'CUNDINAMARCA', 'GUACHETA'],
    ['15', '115', 'CUNDINAMARCA', 'GUADUAS'],
    ['15', '118', 'CUNDINAMARCA', 'GUASCA'],
    ['15', '121', 'CUNDINAMARCA', 'GUATAQUI'],
    ['15', '124', 'CUNDINAMARCA', 'GUATAVITA'],
    ['15', '127', 'CUNDINAMARCA', 'GUAYABAL DE SIQUIMA'],
    ['15', '128', 'CUNDINAMARCA', 'GUAYABETAL'],
    ['15', '130', 'CUNDINAMARCA', 'GUTIERREZ'],
    ['15', '132', 'CUNDINAMARCA', 'GRANADA'],
    ['15', '133', 'CUNDINAMARCA', 'JERUSALEN'],
    ['15', '136', 'CUNDINAMARCA', 'JUNIN'],
    ['15', '139', 'CUNDINAMARCA', 'LA CALERA'],
    ['15', '142', 'CUNDINAMARCA', 'LA MESA'],
    ['15', '145', 'CUNDINAMARCA', 'LA PALMA'],
    ['15', '148', 'CUNDINAMARCA', 'LA PE/A'],
    ['15', '151', 'CUNDINAMARCA', 'LA VEGA'],
    ['15', '154', 'CUNDINAMARCA', 'LENGUAZAQUE'],
    ['15', '157', 'CUNDINAMARCA', 'MACHETA'],
    ['15', '160', 'CUNDINAMARCA', 'MADRID'],
    ['15', '163', 'CUNDINAMARCA', 'MANTA'],
    ['15', '166', 'CUNDINAMARCA', 'MEDINA'],
    ['15', '169', 'CUNDINAMARCA', 'MOSQUERA'],
    ['15', '172', 'CUNDINAMARCA', 'NARI/O'],
    ['15', '175', 'CUNDINAMARCA', 'NEMOCON'],
    ['15', '178', 'CUNDINAMARCA', 'NILO'],
    ['15', '181', 'CUNDINAMARCA', 'NIMAIMA'],
    ['15', '184', 'CUNDINAMARCA', 'NOCAIMA'],
    ['15', '190', 'CUNDINAMARCA', 'PACHO'],
    ['15', '193', 'CUNDINAMARCA', 'PAIME'],
    ['15', '196', 'CUNDINAMARCA', 'PANDI'],
    ['15', '198', 'CUNDINAMARCA', 'PARATEBUENO (LA NAGUAYA)'],
    ['15', '199', 'CUNDINAMARCA', 'PASCA'],
    ['15', '202', 'CUNDINAMARCA', 'PUERTO SALGAR'],
    ['15', '205', 'CUNDINAMARCA', 'PULI'],
    ['15', '208', 'CUNDINAMARCA', 'QUEBRADANEGRA'],
    ['15', '211', 'CUNDINAMARCA', 'QUETAME'],
    ['15', '214', 'CUNDINAMARCA', 'QUIPILE'],
    ['15', '217', 'CUNDINAMARCA', 'APULO'],
    ['15', '218', 'CUNDINAMARCA', 'RICAURTE'],
    ['15', '220', 'CUNDINAMARCA', 'SAN ANTONIO DEL TEQUENDAMA'],
    ['15', '223', 'CUNDINAMARCA', 'SAN BERNARDO'],
    ['15', '226', 'CUNDINAMARCA', 'SAN CAYETANO'],
    ['15', '229', 'CUNDINAMARCA', 'SAN FRANCISCO'],
    ['15', '232', 'CUNDINAMARCA', 'SAN JUAN DE RIOSECO'],
    ['15', '235', 'CUNDINAMARCA', 'SASAIMA'],
    ['15', '238', 'CUNDINAMARCA', 'SESQUILE'],
    ['15', '239', 'CUNDINAMARCA', 'SIBATE'],
    ['15', '241', 'CUNDINAMARCA', 'SILVANIA'],
    ['15', '244', 'CUNDINAMARCA', 'SIMIJACA'],
    ['15', '247', 'CUNDINAMARCA', 'SOACHA'],
    ['15', '250', 'CUNDINAMARCA', 'SOPO'],
    ['15', '256', 'CUNDINAMARCA', 'SUBACHOQUE'],
    ['15', '259', 'CUNDINAMARCA', 'SUESCA'],
    ['15', '262', 'CUNDINAMARCA', 'SUPATA'],
    ['15', '265', 'CUNDINAMARCA', 'SUSA'],
    ['15', '268', 'CUNDINAMARCA', 'SUTATAUSA'],
    ['15', '271', 'CUNDINAMARCA', 'TABIO'],
    ['15', '274', 'CUNDINAMARCA', 'TAUSA'],
    ['15', '277', 'CUNDINAMARCA', 'TENA'],
    ['15', '280', 'CUNDINAMARCA', 'TENJO'],
    ['15', '283', 'CUNDINAMARCA', 'TIBACUY'],
    ['15', '286', 'CUNDINAMARCA', 'TIBIRITA'],
    ['15', '289', 'CUNDINAMARCA', 'TOCAIMA'],
    ['15', '292', 'CUNDINAMARCA', 'TOCANCIPA'],
    ['15', '295', 'CUNDINAMARCA', 'TOPAIPI'],
    ['15', '298', 'CUNDINAMARCA', 'UBALA'],
    ['15', '301', 'CUNDINAMARCA', 'UBAQUE'],
    ['15', '304', 'CUNDINAMARCA', 'UBATE'],
    ['15', '307', 'CUNDINAMARCA', 'UNE'],
    ['15', '316', 'CUNDINAMARCA', 'UTICA'],
    ['15', '318', 'CUNDINAMARCA', 'VENECIA'],
    ['15', '319', 'CUNDINAMARCA', 'VERGARA'],
    ['15', '322', 'CUNDINAMARCA', 'VIANI'],
    ['15', '323', 'CUNDINAMARCA', 'VILLAGOMEZ'],
    ['15', '325', 'CUNDINAMARCA', 'VILLAPINZON'],
    ['15', '328', 'CUNDINAMARCA', 'VILLETA'],
    ['15', '331', 'CUNDINAMARCA', 'VIOTA'],
    ['15', '334', 'CUNDINAMARCA', 'YACOPI'],
    ['15', '337', 'CUNDINAMARCA', 'ZIPACON'],
    ['15', '340', 'CUNDINAMARCA', 'ZIPAQUIRA'],
    ['15', '001', 'CUNDINAMARCA', 'BOGOTA, D.C.'],
    ['16', '001', 'BOGOTA D.C', 'BOGOTA, D.C.'],
    ['17', '001', 'CHOCO', 'QUIBDO'],
    ['17', '002', 'CHOCO', 'ATRATO (YUTO)'],
    ['17', '004', 'CHOCO', 'ACANDI'],
    ['17', '006', 'CHOCO', 'ALTO BAUDO (PIE DE PATO)'],
    ['17', '007', 'CHOCO', 'BAGADO'],
    ['17', '008', 'CHOCO', 'BAHIA SOLANO (MUTIS)'],
    ['17', '010', 'CHOCO', 'BAJO BAUDO (PIZARRO)'],
    ['17', '011', 'CHOCO', 'BOJAYA (BELLAVISTA)'],
    ['17', '012', 'CHOCO', 'MEDIO ATRATO (BETE)'],
    ['17', '013', 'CHOCO', 'CONDOTO'],
    ['17', '014', 'CHOCO', 'CERTEGUI'],
    ['17', '015', 'CHOCO', 'CARMEN DEL DARIEN'],
    ['17', '016', 'CHOCO', 'EL CARMEN'],
    ['17', '017', 'CHOCO', 'EL CANTON DEL SAN PABLO (MAN.'],
    ['17', '019', 'CHOCO', 'ISTMINA'],
    ['17', '022', 'CHOCO', 'JURADO'],
    ['17', '025', 'CHOCO', 'LLORO'],
    ['17', '026', 'CHOCO', 'MEDIO BAUDO (PUERTO MELUK)'],
    ['17', '027', 'CHOCO', 'MEDIO SAN JUAN'],
    ['17', '028', 'CHOCO', 'NOVITA'],
    ['17', '031', 'CHOCO', 'NUQUI'],
    ['17', '032', 'CHOCO', 'RIO IRO'],
    ['17', '034', 'CHOCO', 'RIOSUCIO'],
    ['17', '035', 'CHOCO', 'RIO QUITO (PAIMADO)'],
    ['17', '037', 'CHOCO', 'SAN JOSE DEL PALMAR'],
    ['17', '038', 'CHOCO', 'EL LITORAL DEL SAN JUAN'],
    ['17', '040', 'CHOCO', 'SIPI'],
    ['17', '043', 'CHOCO', 'TADO'],
    ['17', '048', 'CHOCO', 'UNGUIA'],
    ['17', '060', 'CHOCO', 'UNION PANAMERICANA (LAS ANIMAS'],
    ['19', '001', 'HUILA', 'NEIVA'],
    ['19', '004', 'HUILA', 'ACEVEDO'],
    ['19', '007', 'HUILA', 'AGRADO'],
    ['19', '010', 'HUILA', 'AIPE'],
    ['19', '013', 'HUILA', 'ALGECIRAS'],
    ['19', '016', 'HUILA', 'ALTAMIRA'],
    ['19', '019', 'HUILA', 'BARAYA'],
    ['19', '022', 'HUILA', 'CAMPOALEGRE'],
    ['19', '025', 'HUILA', 'TESALIA (CARNICERIAS)'],
    ['19', '028', 'HUILA', 'COLOMBIA'],
    ['19', '031', 'HUILA', 'ELIAS'],
    ['19', '034', 'HUILA', 'GARZON'],
    ['19', '037', 'HUILA', 'GIGANTE'],
    ['19', '040', 'HUILA', 'GUADALUPE'],
    ['19', '043', 'HUILA', 'HOBO'],
    ['19', '044', 'HUILA', 'ISNOS'],
    ['19', '046', 'HUILA', 'IQUIRA'],
    ['19', '047', 'HUILA', 'LA ARGENTINA (PLATA VIEJA)'],
    ['19', '049', 'HUILA', 'LA PLATA'],
    ['19', '050', 'HUILA', 'NATAGA'],
    ['19', '051', 'HUILA', 'OPORAPA'],
    ['19', '052', 'HUILA', 'PAICOL'],
    ['19', '055', 'HUILA', 'PALERMO'],
    ['19', '056', 'HUILA', 'PALESTINA'],
    ['19', '058', 'HUILA', 'PITAL'],
    ['19', '061', 'HUILA', 'PITALITO'],
    ['19', '064', 'HUILA', 'RIVERA'],
    ['19', '067', 'HUILA', 'SALADOBLANCO'],
    ['19', '070', 'HUILA', 'SAN AGUSTIN'],
    ['19', '074', 'HUILA', 'SANTA MARIA'],
    ['19', '076', 'HUILA', 'SUAZA'],
    ['19', '079', 'HUILA', 'TARQUI'],
    ['19', '082', 'HUILA', 'TELLO'],
    ['19', '085', 'HUILA', 'TERUEL'],
    ['19', '088', 'HUILA', 'TIMANA'],
    ['19', '091', 'HUILA', 'VILLAVIEJA'],
    ['19', '094', 'HUILA', 'YAGUARA'],
    ['21', '001', 'MAGDALENA', 'SANTA MARTA'],
    ['21', '008', 'MAGDALENA', 'ALGARROBO'],
    ['21', '010', 'MAGDALENA', 'ARACATACA'],
    ['21', '012', 'MAGDALENA', 'ARIGUANI (EL DIFICIL)'],
    ['21', '013', 'MAGDALENA', 'CERRO DE SAN ANTONIO'],
    ['21', '015', 'MAGDALENA', 'CHIVOLO'],
    ['21', '016', 'MAGDALENA', 'CIENAGA'],
    ['21', '020', 'MAGDALENA', 'CONCORDIA'],
    ['21', '025', 'MAGDALENA', 'EL BANCO'],
    ['21', '028', 'MAGDALENA', 'EL PI/ON'],
    ['21', '030', 'MAGDALENA', 'EL RETEN'],
    ['21', '031', 'MAGDALENA', 'FUNDACION'],
    ['21', '040', 'MAGDALENA', 'GUAMAL'],
    ['21', '042', 'MAGDALENA', 'NUEVA GRANADA'],
    ['21', '046', 'MAGDALENA', 'PEDRAZA'],
    ['21', '048', 'MAGDALENA', 'PIJI/O DEL CARMEN'],
    ['21', '049', 'MAGDALENA', 'PIVIJAY'],
    ['21', '052', 'MAGDALENA', 'PLATO'],
    ['21', '055', 'MAGDALENA', 'PUEBLOVIEJO'],
    ['21', '058', 'MAGDALENA', 'REMOLINO'],
    ['21', '060', 'MAGDALENA', 'SABANAS DE SAN ANGEL'],
    ['21', '067', 'MAGDALENA', 'SALAMINA'],
    ['21', '070', 'MAGDALENA', 'SAN SEBASTIAN DE BUENAVISTA'],
    ['21', '073', 'MAGDALENA', 'SAN ZENON'],
    ['21', '076', 'MAGDALENA', 'SANTA ANA'],
    ['21', '078', 'MAGDALENA', 'SANTA BARBARA DE PINTO'],
    ['21', '079', 'MAGDALENA', 'SITIONUEVO'],
    ['21', '085', 'MAGDALENA', 'TENERIFE'],
    ['21', '090', 'MAGDALENA', 'ZAPAYAN'],
    ['21', '095', 'MAGDALENA', 'ZONA BANANERA (SEVILLA)'],
    ['23', '001', 'NARIÑO', 'PASTO'],
    ['23', '004', 'NARIÑO', 'ALBAN (SAN JOSE)'],
    ['23', '007', 'NARIÑO', 'ALDANA'],
    ['23', '010', 'NARIÑO', 'ANCUYA'],
    ['23', '013', 'NARIÑO', 'ARBOLEDA (BERRUECOS)'],
    ['23', '016', 'NARIÑO', 'BARBACOAS'],
    ['23', '017', 'NARIÑO', 'BELEN'],
    ['23', '019', 'NARIÑO', 'BUESACO'],
    ['23', '022', 'NARIÑO', 'COLON (GENOVA)'],
    ['23', '025', 'NARIÑO', 'CONSACA'],
    ['23', '028', 'NARIÑO', 'CONTADERO'],
    ['23', '031', 'NARIÑO', 'CORDOBA'],
    ['23', '034', 'NARIÑO', 'CUASPUD (CARLOSAMA)'],
    ['23', '037', 'NARIÑO', 'CUMBAL'],
    ['23', '038', 'NARIÑO', 'CHACHAGUI'],
    ['23', '039', 'NARIÑO', 'CUMBITARA'],
    ['23', '040', 'NARIÑO', 'EL ROSARIO'],
    ['23', '041', 'NARIÑO', 'EL CHARCO'],
    ['23', '043', 'NARIÑO', 'EL TABLON'],
    ['23', '044', 'NARIÑO', 'EL PE/OL'],
    ['23', '046', 'NARIÑO', 'EL TAMBO'],
    ['23', '047', 'NARIÑO', 'FRANCISCO PIZARRO (SALAHONDA)'],
    ['23', '049', 'NARIÑO', 'FUNES'],
    ['23', '052', 'NARIÑO', 'GUACHUCAL'],
    ['23', '055', 'NARIÑO', 'GUAITARILLA'],
    ['23', '058', 'NARIÑO', 'GUALMATAN'],
    ['23', '061', 'NARIÑO', 'ILES'],
    ['23', '064', 'NARIÑO', 'IMUES'],
    ['23', '067', 'NARIÑO', 'IPIALES'],
    ['23', '073', 'NARIÑO', 'LA CRUZ'],
    ['23', '076', 'NARIÑO', 'LA FLORIDA'],
    ['23', '077', 'NARIÑO', 'LA LLANADA'],
    ['23', '078', 'NARIÑO', 'LA TOLA'],
    ['23', '079', 'NARIÑO', 'LA UNION'],
    ['23', '080', 'NARIÑO', 'LEIVA'],
    ['23', '082', 'NARIÑO', 'LINARES'],
    ['23', '085', 'NARIÑO', 'LOS ANDES (SOTOMAYOR)'],
    ['23', '088', 'NARIÑO', 'MAGUI (PAYAN)'],
    ['23', '091', 'NARIÑO', 'MALLAMA (PIEDRANCHA)'],
    ['23', '094', 'NARIÑO', 'MOSQUERA'],
    ['23', '095', 'NARIÑO', 'OLAYA HERRERA'],
    ['23', '096', 'NARIÑO', 'NARI/O'],
    ['23', '097', 'NARIÑO', 'OSPINA'],
    ['23', '098', 'NARIÑO', 'POLICARPA'],
    ['23', '100', 'NARIÑO', 'POTOSI'],
    ['23', '101', 'NARIÑO', 'PROVIDENCIA'],
    ['23', '103', 'NARIÑO', 'PUERRES'],
    ['23', '106', 'NARIÑO', 'PUPIALES'],
    ['23', '109', 'NARIÑO', 'RICAURTE'],
    ['23', '112', 'NARIÑO', 'ROBERTO PAYAN (SAN JOSE)'],
    ['23', '115', 'NARIÑO', 'SAMANIEGO'],
    ['23', '118', 'NARIÑO', 'SANDONA'],
    ['23', '120', 'NARIÑO', 'SAN BERNARDO'],
    ['23', '121', 'NARIÑO', 'SAN LORENZO'],
    ['23', '123', 'NARIÑO', 'SAN PEDRO DE CARTAGO'],
    ['23', '124', 'NARIÑO', 'SAN PABLO'],
    ['23', '125', 'NARIÑO', 'SANTA BARBARA (ISCUANDE)'],
    ['23', '127', 'NARIÑO', 'SANTACRUZ (GUACHAVES)'],
    ['23', '130', 'NARIÑO', 'SAPUYES'],
    ['23', '133', 'NARIÑO', 'TAMINANGO'],
    ['23', '136', 'NARIÑO', 'TANGUA'],
    ['23', '139', 'NARIÑO', 'TUMACO'],
    ['23', '142', 'NARIÑO', 'TUQUERRES'],
    ['23', '145', 'NARIÑO', 'YACUANQUER'],
    ['24', '001', 'RISARALDA', 'PEREIRA'],
    ['24', '008', 'RISARALDA', 'APIA'],
    ['24', '013', 'RISARALDA', 'BALBOA'],
    ['24', '021', 'RISARALDA', 'BELEN DE UMBRIA'],
    ['24', '025', 'RISARALDA', 'DOSQUEBRADAS'],
    ['24', '029', 'RISARALDA', 'GUATICA'],
    ['24', '038', 'RISARALDA', 'LA CELIA'],
    ['24', '046', 'RISARALDA', 'LA VIRGINIA'],
    ['24', '054', 'RISARALDA', 'MARSELLA'],
    ['24', '062', 'RISARALDA', 'MISTRATO'],
    ['24', '070', 'RISARALDA', 'PUEBLO RICO'],
    ['24', '078', 'RISARALDA', 'QUINCHIA'],
    ['24', '086', 'RISARALDA', 'SANTA ROSA DE CABAL'],
    ['24', '094', 'RISARALDA', 'SANTUARIO'],
    ['25', '001', 'NORTE DE SANTANDER', 'CUCUTA'],
    ['25', '004', 'NORTE DE SANTANDER', 'ABREGO'],
    ['25', '007', 'NORTE DE SANTANDER', 'ARBOLEDAS'],
    ['25', '010', 'NORTE DE SANTANDER', 'BOCHALEMA'],
    ['25', '013', 'NORTE DE SANTANDER', 'BUCARASICA'],
    ['25', '016', 'NORTE DE SANTANDER', 'CACOTA'],
    ['25', '019', 'NORTE DE SANTANDER', 'CACHIRA'],
    ['25', '022', 'NORTE DE SANTANDER', 'CONVENCION'],
    ['25', '025', 'NORTE DE SANTANDER', 'CUCUTILLA'],
    ['25', '028', 'NORTE DE SANTANDER', 'CHINACOTA'],
    ['25', '031', 'NORTE DE SANTANDER', 'CHITAGA'],
    ['25', '034', 'NORTE DE SANTANDER', 'DURANIA'],
    ['25', '036', 'NORTE DE SANTANDER', 'EL TARRA'],
    ['25', '037', 'NORTE DE SANTANDER', 'EL CARMEN'],
    ['25', '038', 'NORTE DE SANTANDER', 'EL ZULIA'],
    ['25', '040', 'NORTE DE SANTANDER', 'GRAMALOTE'],
    ['25', '043', 'NORTE DE SANTANDER', 'HACARI'],
    ['25', '046', 'NORTE DE SANTANDER', 'HERRAN'],
    ['25', '049', 'NORTE DE SANTANDER', 'LABATECA'],
    ['25', '051', 'NORTE DE SANTANDER', 'LA ESPERANZA'],
    ['25', '052', 'NORTE DE SANTANDER', 'LA PLAYA'],
    ['25', '054', 'NORTE DE SANTANDER', 'LOS PATIOS'],
    ['25', '055', 'NORTE DE SANTANDER', 'LOURDES'],
    ['25', '058', 'NORTE DE SANTANDER', 'MUTISCUA'],
    ['25', '061', 'NORTE DE SANTANDER', 'OCA/A'],
    ['25', '064', 'NORTE DE SANTANDER', 'PAMPLONA'],
    ['25', '067', 'NORTE DE SANTANDER', 'PAMPLONITA'],
    ['25', '069', 'NORTE DE SANTANDER', 'PUERTO SANTANDER'],
    ['25', '070', 'NORTE DE SANTANDER', 'RAGONVALIA'],
    ['25', '073', 'NORTE DE SANTANDER', 'SALAZAR'],
    ['25', '076', 'NORTE DE SANTANDER', 'SAN CALIXTO'],
    ['25', '079', 'NORTE DE SANTANDER', 'SAN CAYETANO'],
    ['25', '082', 'NORTE DE SANTANDER', 'SANTIAGO'],
    ['25', '085', 'NORTE DE SANTANDER', 'SARDINATA'],
    ['25', '088', 'NORTE DE SANTANDER', 'SILOS'],
    ['25', '091', 'NORTE DE SANTANDER', 'TEORAMA'],
    ['25', '093', 'NORTE DE SANTANDER', 'TIBU'],
    ['25', '094', 'NORTE DE SANTANDER', 'TOLEDO'],
    ['25', '097', 'NORTE DE SANTANDER', 'VILLA CARO'],
    ['25', '100', 'NORTE DE SANTANDER', 'VILLA DEL ROSARIO'],
    ['26', '001', 'QUINDIO', 'ARMENIA'],
    ['26', '005', 'QUINDIO', 'BUENAVISTA'],
    ['26', '010', 'QUINDIO', 'CALARCA'],
    ['26', '020', 'QUINDIO', 'CIRCASIA'],
    ['26', '025', 'QUINDIO', 'CORDOBA'],
    ['26', '030', 'QUINDIO', 'FILANDIA'],
    ['26', '040', 'QUINDIO', 'GENOVA'],
    ['26', '050', 'QUINDIO', 'LA TEBAIDA'],
    ['26', '060', 'QUINDIO', 'MONTENEGRO'],
    ['26', '070', 'QUINDIO', 'PIJAO'],
    ['26', '080', 'QUINDIO', 'QUIMBAYA'],
    ['26', '090', 'QUINDIO', 'SALENTO'],
    ['27', '001', 'SANTANDER', 'BUCARAMANGA'],
    ['27', '004', 'SANTANDER', 'AGUADA'],
    ['27', '007', 'SANTANDER', 'ALBANIA'],
    ['27', '010', 'SANTANDER', 'ARATOCA'],
    ['27', '013', 'SANTANDER', 'BARBOSA'],
    ['27', '016', 'SANTANDER', 'BARICHARA'],
    ['27', '019', 'SANTANDER', 'BARRANCABERMEJA'],
    ['27', '022', 'SANTANDER', 'BETULIA'],
    ['27', '025', 'SANTANDER', 'BOLIVAR'],
    ['27', '028', 'SANTANDER', 'CABRERA'],
    ['27', '031', 'SANTANDER', 'CALIFORNIA'],
    ['27', '034', 'SANTANDER', 'CAPITANEJO'],
    ['27', '037', 'SANTANDER', 'CARCASI'],
    ['27', '040', 'SANTANDER', 'CEPITA'],
    ['27', '043', 'SANTANDER', 'CERRITO'],
    ['27', '045', 'SANTANDER', 'CIMITARRA'],
    ['27', '046', 'SANTANDER', 'CONCEPCION'],
    ['27', '049', 'SANTANDER', 'CONFINES'],
    ['27', '052', 'SANTANDER', 'CONTRATACION'],
    ['27', '055', 'SANTANDER', 'COROMORO'],
    ['27', '058', 'SANTANDER', 'CURITI'],
    ['27', '061', 'SANTANDER', 'CHARALA'],
    ['27', '064', 'SANTANDER', 'CHARTA'],
    ['27', '067', 'SANTANDER', 'CHIMA'],
    ['27', '070', 'SANTANDER', 'CHIPATA'],
    ['27', '071', 'SANTANDER', 'EL CARMEN'],
    ['27', '073', 'SANTANDER', 'EL GUACAMAYO'],
    ['27', '074', 'SANTANDER', 'EL PLAYON'],
    ['27', '075', 'SANTANDER', 'EL PE/ON'],
    ['27', '076', 'SANTANDER', 'ENCINO'],
    ['27', '079', 'SANTANDER', 'ENCISO'],
    ['27', '080', 'SANTANDER', 'FLORIAN'],
    ['27', '082', 'SANTANDER', 'FLORIDABLANCA'],
    ['27', '085', 'SANTANDER', 'GALAN'],
    ['27', '088', 'SANTANDER', 'GAMBITA'],
    ['27', '091', 'SANTANDER', 'GIRON'],
    ['27', '094', 'SANTANDER', 'GUACA'],
    ['27', '097', 'SANTANDER', 'GUADALUPE'],
    ['27', '100', 'SANTANDER', 'GUAPOTA'],
    ['27', '103', 'SANTANDER', 'GUAVATA'],
    ['27', '106', 'SANTANDER', 'GUEPSA'],
    ['27', '109', 'SANTANDER', 'HATO'],
    ['27', '112', 'SANTANDER', 'JESUS MARIA'],
    ['27', '115', 'SANTANDER', 'JORDAN'],
    ['27', '118', 'SANTANDER', 'LA PAZ'],
    ['27', '119', 'SANTANDER', 'LA BELLEZA'],
    ['27', '120', 'SANTANDER', 'LANDAZURI'],
    ['27', '121', 'SANTANDER', 'LEBRIJA'],
    ['27', '124', 'SANTANDER', 'LOS SANTOS'],
    ['27', '127', 'SANTANDER', 'MACARAVITA'],
    ['27', '130', 'SANTANDER', 'MALAGA'],
    ['27', '133', 'SANTANDER', 'MATANZA'],
    ['27', '136', 'SANTANDER', 'MOGOTES'],
    ['27', '139', 'SANTANDER', 'MOLAGAVITA'],
    ['27', '142', 'SANTANDER', 'OCAMONTE'],
    ['27', '145', 'SANTANDER', 'OIBA'],
    ['27', '148', 'SANTANDER', 'ONZAGA'],
    ['27', '151', 'SANTANDER', 'PALMAR'],
    ['27', '154', 'SANTANDER', 'PALMAS DEL SOCORRO'],
    ['27', '157', 'SANTANDER', 'PARAMO'],
    ['27', '160', 'SANTANDER', 'PIEDECUESTA'],
    ['27', '163', 'SANTANDER', 'PINCHOTE'],
    ['27', '166', 'SANTANDER', 'PUENTE NACIONAL'],
    ['27', '167', 'SANTANDER', 'PUERTO PARRA'],
    ['27', '169', 'SANTANDER', 'PUERTO WILCHES'],
    ['27', '172', 'SANTANDER', 'RIONEGRO'],
    ['27', '174', 'SANTANDER', 'SABANA DE TORRES'],
    ['27', '175', 'SANTANDER', 'SAN ANDRES'],
    ['27', '178', 'SANTANDER', 'SAN BENITO'],
    ['27', '181', 'SANTANDER', 'SAN GIL'],
    ['27', '184', 'SANTANDER', 'SAN JOAQUIN'],
    ['27', '187', 'SANTANDER', 'SAN JOSE DE MIRANDA'],
    ['27', '190', 'SANTANDER', 'SAN MIGUEL'],
    ['27', '193', 'SANTANDER', 'SAN VICENTE DE CHUCURI'],
    ['27', '194', 'SANTANDER', 'SANTA HELENA DEL OPON'],
    ['27', '195', 'SANTANDER', 'SANTA BARBARA'],
    ['27', '196', 'SANTANDER', 'SIMACOTA'],
    ['27', '199', 'SANTANDER', 'SOCORRO'],
    ['27', '202', 'SANTANDER', 'SUAITA'],
    ['27', '205', 'SANTANDER', 'SUCRE'],
    ['27', '208', 'SANTANDER', 'SURATA'],
    ['27', '211', 'SANTANDER', 'TONA'],
    ['27', '217', 'SANTANDER', 'VALLE DE SAN JOSE'],
    ['27', '219', 'SANTANDER', 'VETAS'],
    ['27', '220', 'SANTANDER', 'VELEZ'],
    ['27', '221', 'SANTANDER', 'VILLANUEVA'],
    ['27', '223', 'SANTANDER', 'ZAPATOCA'],
    ['28', '001', 'SUCRE', 'SINCELEJO'],
    ['28', '010', 'SUCRE', 'BUENAVISTA'],
    ['28', '020', 'SUCRE', 'CAIMITO'],
    ['28', '030', 'SUCRE', 'COLOSO (RICAURTE)'],
    ['28', '040', 'SUCRE', 'COROZAL'],
    ['28', '041', 'SUCRE', 'COVE/AS'],
    ['28', '042', 'SUCRE', 'EL ROBLE'],
    ['28', '045', 'SUCRE', 'CHALAN'],
    ['28', '048', 'SUCRE', 'GALERAS (NUEVA GRANADA)'],
    ['28', '049', 'SUCRE', 'GUARANDA'],
    ['28', '050', 'SUCRE', 'LA UNION'],
    ['28', '055', 'SUCRE', 'LOS PALMITOS'],
    ['28', '060', 'SUCRE', 'MAJAGUAL'],
    ['28', '080', 'SUCRE', 'MORROA'],
    ['28', '100', 'SUCRE', 'OVEJAS'],
    ['28', '120', 'SUCRE', 'PALMITO'],
    ['28', '160', 'SUCRE', 'SAMPUES'],
    ['28', '180', 'SUCRE', 'SAN BENITO ABAD'],
    ['28', '190', 'SUCRE', 'SAN JUAN DE BETULIA (BETULIA)'],
    ['28', '200', 'SUCRE', 'SAN MARCOS'],
    ['28', '220', 'SUCRE', 'SAN ONOFRE'],
    ['28', '240', 'SUCRE', 'SAN PEDRO'],
    ['28', '260', 'SUCRE', 'SINCE'],
    ['28', '280', 'SUCRE', 'SUCRE'],
    ['28', '300', 'SUCRE', 'TOLU'],
    ['28', '320', 'SUCRE', 'TOLUVIEJO'],
    ['29', '001', 'TOLIMA', 'IBAGUE'],
    ['29', '004', 'TOLIMA', 'ALPUJARRA'],
    ['29', '007', 'TOLIMA', 'ALVARADO'],
    ['29', '010', 'TOLIMA', 'AMBALEMA'],
    ['29', '013', 'TOLIMA', 'ANZOATEGUI'],
    ['29', '016', 'TOLIMA', 'ARMERO (GUAYABAL)'],
    ['29', '019', 'TOLIMA', 'ATACO'],
    ['29', '022', 'TOLIMA', 'CAJAMARCA'],
    ['29', '025', 'TOLIMA', 'CARMEN DE APICALA'],
    ['29', '028', 'TOLIMA', 'CASABIANCA'],
    ['29', '031', 'TOLIMA', 'COELLO'],
    ['29', '034', 'TOLIMA', 'COYAIMA'],
    ['29', '037', 'TOLIMA', 'CUNDAY'],
    ['29', '040', 'TOLIMA', 'CHAPARRAL'],
    ['29', '043', 'TOLIMA', 'DOLORES'],
    ['29', '046', 'TOLIMA', 'ESPINAL'],
    ['29', '049', 'TOLIMA', 'FALAN'],
    ['29', '052', 'TOLIMA', 'FLANDES'],
    ['29', '055', 'TOLIMA', 'FRESNO'],
    ['29', '058', 'TOLIMA', 'GUAMO'],
    ['29', '061', 'TOLIMA', 'HERVEO'],
    ['29', '064', 'TOLIMA', 'HONDA'],
    ['29', '067', 'TOLIMA', 'ICONONZO'],
    ['29', '070', 'TOLIMA', 'LERIDA'],
    ['29', '073', 'TOLIMA', 'LIBANO'],
    ['29', '076', 'TOLIMA', 'MARIQUITA'],
    ['29', '079', 'TOLIMA', 'MELGAR'],
    ['29', '080', 'TOLIMA', 'MURILLO'],
    ['29', '082', 'TOLIMA', 'NATAGAIMA'],
    ['29', '085', 'TOLIMA', 'ORTEGA'],
    ['29', '087', 'TOLIMA', 'PALOCABILDO'],
    ['29', '088', 'TOLIMA', 'PIEDRAS'],
    ['29', '089', 'TOLIMA', 'PLANADAS'],
    ['29', '091', 'TOLIMA', 'PRADO'],
    ['29', '094', 'TOLIMA', 'PURIFICACION'],
    ['29', '097', 'TOLIMA', 'RIOBLANCO'],
    ['29', '100', 'TOLIMA', 'RONCESVALLES'],
    ['29', '103', 'TOLIMA', 'ROVIRA'],
    ['29', '105', 'TOLIMA', 'SALDA/A'],
    ['29', '106', 'TOLIMA', 'SAN ANTONIO'],
    ['29', '109', 'TOLIMA', 'SAN LUIS'],
    ['29', '112', 'TOLIMA', 'SANTA ISABEL'],
    ['29', '115', 'TOLIMA', 'SUAREZ'],
    ['29', '118', 'TOLIMA', 'VALLE DE SAN JUAN'],
    ['29', '121', 'TOLIMA', 'VENADILLO'],
    ['29', '124', 'TOLIMA', 'VILLAHERMOSA'],
    ['29', '127', 'TOLIMA', 'VILLARRICA'],
    ['31', '001', 'VALLE', 'CALI'],
    ['31', '004', 'VALLE', 'ALCALA'],
    ['31', '007', 'VALLE', 'ANDALUCIA'],
    ['31', '010', 'VALLE', 'ANSERMANUEVO'],
    ['31', '013', 'VALLE', 'ARGELIA'],
    ['31', '016', 'VALLE', 'BOLIVAR'],
    ['31', '019', 'VALLE', 'BUENAVENTURA'],
    ['31', '022', 'VALLE', 'BUGA'],
    ['31', '025', 'VALLE', 'BUGALAGRANDE'],
    ['31', '028', 'VALLE', 'CAICEDONIA'],
    ['31', '031', 'VALLE', 'CANDELARIA'],
    ['31', '034', 'VALLE', 'CARTAGO'],
    ['31', '037', 'VALLE', 'DAGUA'],
    ['31', '040', 'VALLE', 'CALIMA (DARIEN)'],
    ['31', '043', 'VALLE', 'EL AGUILA'],
    ['31', '046', 'VALLE', 'EL CAIRO'],
    ['31', '049', 'VALLE', 'EL CERRITO'],
    ['31', '052', 'VALLE', 'EL DOVIO'],
    ['31', '055', 'VALLE', 'FLORIDA'],
    ['31', '058', 'VALLE', 'GINEBRA'],
    ['31', '061', 'VALLE', 'GUACARI'],
    ['31', '064', 'VALLE', 'JAMUNDI'],
    ['31', '067', 'VALLE', 'LA CUMBRE'],
    ['31', '070', 'VALLE', 'LA UNION'],
    ['31', '073', 'VALLE', 'LA VICTORIA'],
    ['31', '076', 'VALLE', 'OBANDO'],
    ['31', '079', 'VALLE', 'PALMIRA'],
    ['31', '082', 'VALLE', 'PRADERA'],
    ['31', '085', 'VALLE', 'RESTREPO'],
    ['31', '088', 'VALLE', 'RIOFRIO'],
    ['31', '091', 'VALLE', 'ROLDANILLO'],
    ['31', '094', 'VALLE', 'SAN PEDRO'],
    ['31', '097', 'VALLE', 'SEVILLA'],
    ['31', '100', 'VALLE', 'TORO'],
    ['31', '103', 'VALLE', 'TRUJILLO'],
    ['31', '106', 'VALLE', 'TULUA'],
    ['31', '109', 'VALLE', 'ULLOA'],
    ['31', '112', 'VALLE', 'VERSALLES'],
    ['31', '115', 'VALLE', 'VIJES'],
    ['31', '118', 'VALLE', 'YOTOCO'],
    ['31', '121', 'VALLE', 'YUMBO'],
    ['31', '124', 'VALLE', 'ZARZAL'],
    ['40', '001', 'ARAUCA', 'ARAUCA'],
    ['40', '005', 'ARAUCA', 'TAME'],
    ['40', '010', 'ARAUCA', 'ARAUQUITA'],
    ['40', '015', 'ARAUCA', 'CRAVO NORTE'],
    ['40', '017', 'ARAUCA', 'FORTUL'],
    ['40', '020', 'ARAUCA', 'PUERTO RONDON'],
    ['40', '025', 'ARAUCA', 'SARAVENA'],
    ['44', '001', 'CAQUETA', 'FLORENCIA'],
    ['44', '002', 'CAQUETA', 'ALBANIA'],
    ['44', '003', 'CAQUETA', 'CARTAGENA DEL CHAIRA'],
    ['44', '004', 'CAQUETA', 'BELEN DE LOS ANDAQUIES'],
    ['44', '005', 'CAQUETA', 'EL DONCELLO'],
    ['44', '006', 'CAQUETA', 'EL PAUJIL'],
    ['44', '007', 'CAQUETA', 'LA MONTA/ITA'],
    ['44', '009', 'CAQUETA', 'PUERTO RICO'],
    ['44', '010', 'CAQUETA', 'SAN VICENTE DEL CAGUAN'],
    ['44', '012', 'CAQUETA', 'CURILLO'],
    ['44', '016', 'CAQUETA', 'MILAN'],
    ['44', '017', 'CAQUETA', 'MORELIA'],
    ['44', '020', 'CAQUETA', 'SAN JOSE DEL FRAGUA'],
    ['44', '022', 'CAQUETA', 'SOLANO'],
    ['44', '024', 'CAQUETA', 'SOLITA'],
    ['44', '040', 'CAQUETA', 'VALPARAISO'],
    ['46', '001', 'CASANARE', 'YOPAL'],
    ['46', '040', 'CASANARE', 'AGUAZUL'],
    ['46', '120', 'CASANARE', 'CHAMEZA'],
    ['46', '320', 'CASANARE', 'HATO COROZAL'],
    ['46', '480', 'CASANARE', 'LA SALINA'],
    ['46', '520', 'CASANARE', 'MANI'],
    ['46', '540', 'CASANARE', 'MONTERREY'],
    ['46', '560', 'CASANARE', 'NUNCHIA'],
    ['46', '640', 'CASANARE', 'OROCUE'],
    ['46', '680', 'CASANARE', 'PAZ DE ARIPORO (MORENO)'],
    ['46', '700', 'CASANARE', 'PORE'],
    ['46', '760', 'CASANARE', 'RECETOR'],
    ['46', '800', 'CASANARE', 'SABANALARGA'],
    ['46', '815', 'CASANARE', 'SACAMA'],
    ['46', '830', 'CASANARE', 'SAN LUIS DE PALENQUE'],
    ['46', '840', 'CASANARE', 'TAMARA'],
    ['46', '850', 'CASANARE', 'TAURAMENA'],
    ['46', '865', 'CASANARE', 'TRINIDAD'],
    ['46', '880', 'CASANARE', 'VILLANUEVA'],
    ['48', '001', 'LA GUAJIRA', 'RIOHACHA'],
    ['48', '002', 'LA GUAJIRA', 'ALBANIA'],
    ['48', '004', 'LA GUAJIRA', 'BARRANCAS'],
    ['48', '005', 'LA GUAJIRA', 'DIBULLA'],
    ['48', '006', 'LA GUAJIRA', 'EL MOLINO'],
    ['48', '007', 'LA GUAJIRA', 'FONSECA'],
    ['48', '008', 'LA GUAJIRA', 'DISTRACCION'],
    ['48', '009', 'LA GUAJIRA', 'HATONUEVO'],
    ['48', '010', 'LA GUAJIRA', 'MAICAO'],
    ['48', '011', 'LA GUAJIRA', 'MANAURE'],
    ['48', '012', 'LA GUAJIRA', 'LA JAGUA DEL PILAR'],
    ['48', '013', 'LA GUAJIRA', 'SAN JUAN DEL CESAR'],
    ['48', '016', 'LA GUAJIRA', 'URIBIA'],
    ['48', '018', 'LA GUAJIRA', 'URUMITA'],
    ['48', '020', 'LA GUAJIRA', 'VILLANUEVA'],
    ['50', '001', 'GUAINIA', 'INIRIDA'],
    ['50', '050', 'GUAINIA', 'MAPIRIPANA'],
    ['50', '070', 'GUAINIA', 'BARRANCO MINAS'],
    ['50', '073', 'GUAINIA', 'CACAHUAL'],
    ['50', '078', 'GUAINIA', 'LA GUADALUPE'],
    ['50', '083', 'GUAINIA', 'MORICHAL (MORICHAL NUEVO)'],
    ['50', '087', 'GUAINIA', 'PANA PANA (CAMPO ALEGRE)'],
    ['50', '090', 'GUAINIA', 'PUERTO COLOMBIA'],
    ['50', '092', 'GUAINIA', 'SAN FELIPE'],
    ['52', '001', 'META', 'VILLAVICENCIO'],
    ['52', '005', 'META', 'ACACIAS'],
    ['52', '006', 'META', 'BARRANCA DE UPIA'],
    ['52', '008', 'META', 'CABUYARO'],
    ['52', '010', 'META', 'CASTILLA LA NUEVA'],
    ['52', '015', 'META', 'CUBARRAL'],
    ['52', '020', 'META', 'CUMARAL'],
    ['52', '025', 'META', 'EL CALVARIO'],
    ['52', '027', 'META', 'EL CASTILLO'],
    ['52', '028', 'META', 'EL DORADO'],
    ['52', '030', 'META', 'FUENTE DE ORO'],
    ['52', '035', 'META', 'GRANADA'],
    ['52', '040', 'META', 'GUAMAL'],
    ['52', '041', 'META', 'LA MACARENA'],
    ['52', '042', 'META', 'LEJANIAS'],
    ['52', '043', 'META', 'PUERTO GAITAN'],
    ['52', '044', 'META', 'MESETAS'],
    ['52', '045', 'META', 'PUERTO LOPEZ'],
    ['52', '046', 'META', 'MAPIRIPAN'],
    ['52', '047', 'META', 'PUERTO CONCORDIA'],
    ['52', '048', 'META', 'PUERTO LLERAS'],
    ['52', '049', 'META', 'PUERTO RICO'],
    ['52', '050', 'META', 'RESTREPO'],
    ['52', '055', 'META', 'SAN CARLOS DE GUAROA'],
    ['52', '058', 'META', 'SAN JUAN DE ARAMA'],
    ['52', '059', 'META', 'SAN JUANITO'],
    ['52', '060', 'META', 'SAN MARTIN DE LOS LLANOS'],
    ['52', '074', 'META', 'URIBE'],
    ['52', '080', 'META', 'VISTA HERMOSA'],
    ['54', '001', 'GUAVIARE', 'SAN JOSE DEL GUAVIARE'],
    ['54', '003', 'GUAVIARE', 'CALAMAR'],
    ['54', '007', 'GUAVIARE', 'EL RETORNO'],
    ['54', '012', 'GUAVIARE', 'MIRAFLORES'],
    ['56', '001', 'SAN ANDRES', 'SAN ANDRES'],
    ['56', '004', 'SAN ANDRES', 'PROVIDENCIA'],
    ['60', '001', 'AMAZONAS', 'LETICIA'],
    ['60', '007', 'AMAZONAS', 'PUERTO NARI/O'],
    ['60', '010', 'AMAZONAS', 'EL ENCANTO'],
    ['60', '013', 'AMAZONAS', 'LA CHORRERA'],
    ['60', '016', 'AMAZONAS', 'LA PEDRERA'],
    ['60', '017', 'AMAZONAS', 'LA VICTORIA'],
    ['60', '019', 'AMAZONAS', 'MIRITI PARANA'],
    ['60', '021', 'AMAZONAS', 'PUERTO SANTANDER'],
    ['60', '022', 'AMAZONAS', 'TARAPACA'],
    ['60', '030', 'AMAZONAS', 'PUERTO ALEGRIA'],
    ['60', '040', 'AMAZONAS', 'PUERTO ARICA'],
    ['64', '001', 'PUTUMAYO', 'MOCOA'],
    ['64', '002', 'PUTUMAYO', 'PUERTO ASIS'],
    ['64', '004', 'PUTUMAYO', 'PUERTO LEGUIZAMO'],
    ['64', '007', 'PUTUMAYO', 'COLON'],
    ['64', '013', 'PUTUMAYO', 'SAN FRANCISCO'],
    ['64', '016', 'PUTUMAYO', 'SANTIAGO'],
    ['64', '018', 'PUTUMAYO', 'SAN MIGUEL (LA DORADA)'],
    ['64', '019', 'PUTUMAYO', 'SIBUNDOY'],
    ['64', '023', 'PUTUMAYO', 'ORITO'],
    ['64', '025', 'PUTUMAYO', 'PUERTO GUZMAN'],
    ['64', '026', 'PUTUMAYO', 'PUERTO CAICEDO'],
    ['64', '028', 'PUTUMAYO', 'VALLE DEL GUAMUEZ (LA HORMIGA)'],
    ['64', '030', 'PUTUMAYO', 'VILLAGARZON'],
    ['68', '001', 'VAUPES', 'MITU'],
    ['68', '004', 'VAUPES', 'CARURU'],
    ['68', '010', 'VAUPES', 'MORICHAL (PAPUNAGUA)'],
    ['68', '013', 'VAUPES', 'BUENOS AIRES (PACOA)'],
    ['68', '017', 'VAUPES', 'TARAIRA'],
    ['68', '022', 'VAUPES', 'YAVARATE'],
    ['72', '001', 'VICHADA', 'PUERTO CARRE/O'],
    ['72', '002', 'VICHADA', 'SANTA ROSALIA'],
    ['72', '006', 'VICHADA', 'CUMARIBO'],
    ['72', '008', 'VICHADA', 'LA PRIMAVERA'],
    ['88', '120', 'CONSULADOS', 'ALEMANIA'],
    ['88', '140', 'CONSULADOS', 'PAISES BAJ‐ANTILLAS HOLANDESAS'],
    ['88', '155', 'CONSULADOS', 'ARGENTINA'],
    ['88', '160', 'CONSULADOS', 'PAISES BAJOS ‐ ARUBA'],
    ['88', '165', 'CONSULADOS', 'AUSTRALIA'],
    ['88', '170', 'CONSULADOS', 'AUSTRIA'],
    ['88', '185', 'CONSULADOS', 'BARBADOS'],
    ['88', '190', 'CONSULADOS', 'BELGICA'],
    ['88', '195', 'CONSULADOS', 'BELICE'],
    ['88', '215', 'CONSULADOS', 'BOLIVIA'],
    ['88', '220', 'CONSULADOS', 'BRASIL'],
    ['88', '250', 'CONSULADOS', 'CANADA'],
    ['88', '275', 'CONSULADOS', 'COREA DEL SUR'],
    ['88', '285', 'CONSULADOS', 'COSTA RICA'],
    ['88', '290', 'CONSULADOS', 'CUBA'],
    ['88', '300', 'CONSULADOS', 'CHECOSLOVAQUIA'],
    ['88', '305', 'CONSULADOS', 'CHILE'],
    ['88', '315', 'CONSULADOS', 'CHINA REPUBLICA POPULAR'],
    ['88', '320', 'CONSULADOS', 'CHIPRE'],
    ['88', '325', 'CONSULADOS', 'DINAMARCA'],
    ['88', '330', 'CONSULADOS', 'ECUADOR'],
    ['88', '335', 'CONSULADOS', 'EGIPTO'],
    ['88', '340', 'CONSULADOS', 'EL SALVADOR'],
    ['88', '355', 'CONSULADOS', 'ESPA/A'],
    ['88', '360', 'CONSULADOS', 'ESTADOS UNIDOS'],
    ['88', '370', 'CONSULADOS', 'FILIPINAS'],
    ['88', '375', 'CONSULADOS', 'FINLANDIA'],
    ['88', '380', 'CONSULADOS', 'FRANCIA'],
    ['88', '405', 'CONSULADOS', 'GRECIA'],
    ['88', '410', 'CONSULADOS', 'GUATEMALA'],
    ['88', '425', 'CONSULADOS', 'GUYANA'],
    ['88', '430', 'CONSULADOS', 'HAITI'],
    ['88', '435', 'CONSULADOS', 'HOLANDA'],
    ['88', '440', 'CONSULADOS', 'HONDURAS'],
    ['88', '450', 'CONSULADOS', 'HUNGRIA REPUBLICA POPULAR'],
    ['88', '455', 'CONSULADOS', 'INDIA'],
    ['88', '460', 'CONSULADOS', 'INDONESIA'],
    ['88', '465', 'CONSULADOS', 'INGLATERRA'],
    ['88', '475', 'CONSULADOS', 'IRAN'],
    ['88', '480', 'CONSULADOS', 'IRLANDA'],
    ['88', '490', 'CONSULADOS', 'ISRAEL'],
    ['88', '495', 'CONSULADOS', 'ITALIA'],
    ['88', '500', 'CONSULADOS', 'JAMAICA'],
    ['88', '505', 'CONSULADOS', 'JAPON'],
    ['88', '515', 'CONSULADOS', 'KENIA'],
    ['88', '535', 'CONSULADOS', 'LIBANO'],
    ['88', '560', 'CONSULADOS', 'MALASIA'],
    ['88', '580', 'CONSULADOS', 'MARRUECOS'],
    ['88', '590', 'CONSULADOS', 'MEXICO'],
    ['88', '620', 'CONSULADOS', 'NICARAGUA'],
    ['88', '635', 'CONSULADOS', 'NORUEGA'],
    ['88', '655', 'CONSULADOS', 'PANAMA'],
    ['88', '665', 'CONSULADOS', 'PARAGUAY'],
    ['88', '670', 'CONSULADOS', 'PERU'],
    ['88', '675', 'CONSULADOS', 'POLONIA'],
    ['88', '680', 'CONSULADOS', 'PORTUGAL'],
    ['88', '683', 'CONSULADOS', 'PUERTO RICO'],
    ['88', '685', 'CONSULADOS', 'REPUBLICA DOMINICANA'],
    ['88', '695', 'CONSULADOS', 'RUMANIA REPUBLICA SOCIAL'],
    ['88', '700', 'CONSULADOS', 'RUSIA'],
    ['88', '745', 'CONSULADOS', 'SUDAFRICA'],
    ['88', '755', 'CONSULADOS', 'SUECIA'],
    ['88', '760', 'CONSULADOS', 'SUIZA'],
    ['88', '770', 'CONSULADOS', 'TURQUIA'],
    ['88', '785', 'CONSULADOS', 'TRINIDAD Y TOBAGO'],
    ['88', '805', 'CONSULADOS', 'URUGUAY'],
    ['88', '815', 'CONSULADOS', 'VENEZUELA']
]
