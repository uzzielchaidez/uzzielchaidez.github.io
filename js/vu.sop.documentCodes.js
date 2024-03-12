
if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.sop == "undefined") { vu.sop = function() {} }

if (typeof vu.sop.documentCodes == "undefined") { vu.sop.documentCodes = function() {} }

vu.sop.documentCodes.getVUIdFromId = function (id) {
    for (let step = 0; step < vu.sop.documentCodes.codeList.length; step++) {
        if (vu.sop.documentCodes.codeList[step][0] == id) {
           return "VU-" + vu.sop.documentCodes.codeList[step][1]
        }
    }
}

vu.sop.documentCodes.getIdFromVUId = function (vuid) {
    for (let step = 0; step < vu.sop.documentCodes.codeList.length; step++) {
        if (vu.sop.documentCodes.codeList[step][1] == vuid) {
           return vu.sop.documentCodes.codeList[step][0]
        }
    }
}

// id,code,description,shortdescription
vu.sop.documentCodes.codeList = [
    [1,  "ARG-ID-02",   "Documento Argentina", "argentina"],
    [2,  "ARG-ID-01",   "Documento Argentina antiguo", "argentinaantiguo"],
    [3,  "CHL-ID-02",   "Documento Chile,chile"],
    [4,  "CHL-ID-01",   "Documento Chile antiguo", "chileantiguo"],
    [5,  "COL-ID-01",   "Documento Colombia,colombia"],
    [6,  "ECU-ID-01",   "Documento Ecuador,ecuador"],
    [7,  "ECU-ID-02",   "Documento Ecuador Guayaquil", "ecuadorguayaquil"],
    [8,  "SLV-ID-01",   "Documento El Salvador", "elsalvador"],
    [9,  "ESP-ID-02",   "Documento España,espania"],
    [10, "MEX-ID-02",   "Documento México INE", "mexicoine"],
    [11, "MEX-ID-01",   "Documento México IFE", "mexicoife"],
    [12, "PAN-ID-02",   "Documento Panamá,panama"],
    [13, "PAN-ID-01",   "Documento Panamá antiguo", "panamaantiguo"],
    [14, "PAN-IDF-01",  "Documento Panamá residente", "panamaresidente"],
    [15, "ESP-PA-02",   "Pasaporte España", "espaniapasaporte"],
    [16, "PER-ID-01",   "Documento Perú", "peru"],
    [17, "PER-ID-02",   "Documento Perú nuevo", "perunuevo"],
    [18, "PRT-ID-01",   "Documento Portugal", "portugal"],
    [19, "ESP-SC-01",   "Credencial Real Madrid", "realmadrid"],
    [20, "DOM-ID-01",   "Documento República Dominicana", "republicadominicana"],
    [21, "URY-ID-01",   "Documento Uruguay", "uruguay"],
    [22, "PRY-ID-02",   "Documento Paraguay", "paraguay"],
    [23, "PRY-ID-01",   "Documento Paraguay antiguo", "paraguayantiguo"],
    [24, "ESP-ID-01",   "Documento España nuevo", "espanianuevo"],
    [25, "ARG-ID-03",   "Documento Argentina libreta", "argentinalibreta"],
    [26, "BOL-ID-01",   "Documento Bolivia", "bolivia"],
    [27, "MEX-IDF-01",  "Documento México residente", "mexicoresidente"],
    [28, "MEX-ID-03",   "Documento México cédula nacional", "mexicocedulanacional"],
    [29, "MEX-PA-01",   "Pasaporte México", "mexicopasaporte"],
    [30, "SLV-ID-02",   "Documento El Salvador cédula minoridad", "elsalvadorcedulaminoridad"],
    [31, "BRA-DL-01",   "Documento Brasil tránsito", "brasiltransito"],
    [32, "BRA-ID-01",   "Documento Brasil identidad", "brasilcarteiradeidentidade"],
    [33, "BRA-IDF-01",  "Documento Brasil cédula extranjero", "brasilcedulaextranjero"],
    [34, "BOL-ID-02",   "Documento Bolivia ejemplar B", "boliviaejemplarb"],
    [35, "",            "Documento Pasaporte Genérico", "genericpassport"],
    [36, "NLD-PA-01",   "Pasaporte Holanda", "holandapasaporte"],
    [37, "NLD-ID-01",   "Documento Holanda", "holanda"],
    [38, "DEU-ID-01",   "Documento Alemania", "alemania"],
    [39, "ESP-IDF-01",  "Documento España NIE", "espanianie"],
    [40, "FRA-ID-01",   "Documento Francia", "francia"],
    [41, "",            "Documento Genérico,generic"],
    [42, "URY-ID-03",   "Documento Uruguay Cédula", "uruguaycedula"],
    [43, "BRA-ID-02",   "Documento Brasil Identidad Nuevo", "brasilcarteiraidentidadenuevo"],
    [44, "ECU-ID-03",   "Documento Ecuador Cédula", "ecuadorcedula"],
    [45, "BOL-ID-03",   "Documento Bolivia ejemplar C", "boliviaejemplarc"],
    [46, "PER-ID-03",   "Documento Perú Dni E", "perudnie"],
    [47, "DOM-PA-01",   "Pasaporte República Dominicana", "republicadominicanapasaporte"],
    [48, "CRI-ID-03",   "Documento Costa Rica Cédula", "costaricacedula"],
    [49, "COL-IDF-01",  "Documento Colombia Cédula Extranjería", "colombiacedulaextranjeria"],
    [50, "HND-ID-01",   "Documento Honduras,honduras"],
    [51, "PER-IDF-01",  "Documento Perú Extranjería", "perucedulaextranjeria"],
    [52, "GTM-ID-01",   "Documento Guatemala Cédula", "guatemalacedula"],
    [53, "DEU-ID-02",   "Documento Alemania ejemplar B", "alemaniaejemplarb"],
    [54, "DEU-IDF-01",  "Documento Alemania residente", "alemaniaresidente"],
    [55, "DEU-IDF-02",  "Documento Alemania residente ejemplar B,alemaniaresidenteejemplarb"],
    [56, "DEU-PA-01",   "Pasaporte Alemania", "alemaniapasaporte"],
    [57, "DEU-PA-02",   "Pasaporte Alemania ejemplar B", "alemaniapasaporteejemplarb"],
    [58, "PRT-IDF-01",  "Documento Portugal residente", "portugalresidente"],
    [59, "PRT-IDF-02",  "Documento Portugal residente ejemplar B", "portugalresidenteejemplarb"],
    [60, "PRT-IDF-03",  "Documento Portugal residente ejemplar C", "portugalresidenteejemplarc"],
    [61, "PRT-PA-01",   "Pasaporte Portugal", "portugalpasaporte"],
    [62, "PRT-PA-02",   "Pasaporte Portugal ejemplar B", "portugalpasaporteejemplarb"],
    [63, "NLD-IDF-01",  "Documento Holanda residente", "holandaresidente"],
    [64, "NLD-IDF-02",  "Documento Holanda residente ejemplar B", "holandaresidenteejemplarb"],
    [65, "COL-ID-02",   "Documento Colombia ciudadania ejemplar B", "colombiaciudadaniab"],
    [66, "DOM-PA-02",   "Pasaporte República Dominicana ejemplar B", "republicadominicanapasaporteejemplarb"],
    [67, "ESP-PA-01",   "Pasaporte Reino de España", "reinoespaniapasaporte"],
    [68, "ESP-ID-05",   "Documento Reino de España", "reinoespania"],
    [69, "ARG-ID-04",   "Documento Argentina nuevo", "argentinanuevo"],
    [70, "BRA-DL-02",   "Documento Brasil tránsito ejemplar B", "BRA-DL-02"],
    [71, "TTO-ID-01",   "Documento Trinidad y Tobago Antiguo", "TTO-ID-01"],
    [72, "TTO-ID-02",   "Documento Trinidad y Tobago Nuevo", "TTO-ID-02"],
    [73, "TTO-DL-01",   "Documento Trinidad y Tobago Licencia Antigua", "TTO-DL-01"],
    [74, "TTO-DL-02",   "Documento Trinidad y Tobago Licencia Nueva", "TTO-DL-02"],
    [75, "URY-PA-01",   "Pasaporte Uruguay", "URY-PA-01"],
    [76, "PAN-ID-03",   "Documento Panamá nuevo", "PAN-ID-03"],
    [77, "PAN-IDF-02",  "Documento Panamá residente nuevo", "PAN-IDF-02"],
    [78, "VEN-ID-01",   "Cedula Venezuela", "VEN-ID-01"],
    [79, "VEN-PA-01",   "Pasaporte Venezuela", "VEN-PA-01"],
    [80, "VEN-PA-02",   "Pasaporte prorroga Venezuela", "VEN-PA-02"]
]        