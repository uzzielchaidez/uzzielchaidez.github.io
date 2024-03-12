if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.telemetry == "undefined") { vu.telemetry = function() {} }

vu.telemetry.captureResponseCode = {
    FRONT: {
        FRONT_SUCCESS: 100,
        USER_CANCELLED: 101,
        BACKGROUND_TASKING_ERROR: 106,
        DOCUMENT_FACE_NOT_FOUND: 107,
        IMAGE_BLURRED: 109,
    },
    BACK: {
        BACK_SUCCESS: 200,
        USER_CANCELLED: 201,
        BACKGROUND_TASKING_ERROR: 206,
        BARCODE_NOT_FOUND: 207,
        IMAGE_BLURRED: 209,
    },
    SELFIE: {
        SELFIE_SUCCESS: 300,
        USER_CANCELLED: 301,
        SCREEN_RECORDING_ERROR: 303,
        BACKGROUND_TASKING_ERROR: 306,
    }
}

let gestureFeedback = []

let telemetryQueue = [];

let telemetryStartEvent = [];

let telemetryProcessActivity = [];

vu.telemetry.traceId = null;

let captureSelfieSaveBody = {};


vu.telemetry.addEvent = async function (activity , step, eventData) {

  if (step === "start") {

        let captureSaveBaseBody = {
            "traceId": vu.telemetry.traceId,
            "beginAt": new Date(),
        };

        eventData = {...captureSaveBaseBody, ...eventData};
        telemetryStartEvent.push({activity, step, eventData});
  } else if ( step === "end") {

      const existingStartEventIndex = telemetryStartEvent.findIndex(
            entry => entry.activity === activity);

      if (existingStartEventIndex !== -1) {

          if(eventData.isBlurry){
              telemetryProcessActivity.push(telemetryStartEvent[existingStartEventIndex]);
              telemetryProcessActivity[existingStartEventIndex].eventData = {
                  ...telemetryStartEvent[existingStartEventIndex].eventData,
              'endAt': new Date(),
              captureResponseNumber: telemetryStartEvent[existingStartEventIndex].eventData.screenId === 1 ? vu.telemetry.captureResponseCode.FRONT.IMAGE_BLURRED :
              vu.telemetry.captureResponseCode.BACK.IMAGE_BLURRED};

              telemetryQueue.push(telemetryProcessActivity[existingStartEventIndex]);
              telemetryProcessActivity = [];

          } else {


          telemetryStartEvent[existingStartEventIndex].eventData = {
          ...telemetryStartEvent[existingStartEventIndex].eventData,
          ...eventData,
          'endAt': new Date(),};

          telemetryStartEvent[existingStartEventIndex].step = "end";

          if(telemetryStartEvent[existingStartEventIndex].activity === "SelfieActivityProcess"){

             if(eventData.captureResponseNumber !== vu.telemetry.captureResponseCode.SELFIE.SELFIE_SUCCESS){

                 captureSelfieSaveBody = { "minimumValidGestures" : vu.face.ui.gestures.numOfChallenges,
                     "validGestures": gestureFeedback.length,
                     "invalidGestures": vu.face.ui.gestures.numOfChallenges - gestureFeedback.length ,
                     "passedTest" : false,
                     "detail" : gestureFeedback,}

                 telemetryStartEvent[existingStartEventIndex].eventData = {
                     ...telemetryStartEvent[existingStartEventIndex].eventData,
                     ... eventData,
                     ...captureSelfieSaveBody }

             } else {

                 captureSelfieSaveBody = { "minimumValidGestures" : vu.face.ui.gestures.numOfChallenges,
                     "validGestures": vu.face.ui.gestures.numOfChallenges,
                     "invalidGestures": 0,
                     "passedTest" : true,
                     "detail" : gestureFeedback}

                 telemetryStartEvent[existingStartEventIndex].eventData = {
                     ...telemetryStartEvent[existingStartEventIndex].eventData,
                     ...captureSelfieSaveBody }
             }
          }

          telemetryQueue.push(telemetryStartEvent[existingStartEventIndex]);
          telemetryStartEvent.shift();
          gestureFeedback = [];
          }
        }
  }else if (step === "challengeInfo"){

        let captureGestureDetailBody = {"gestureCode" : getGestureCode(eventData.challenge),
                                        "gestureName": eventData.challenge,
                                        "minimumScore": vu.face.ui.gestures.resultsValidatePercentual,
                                        "validFrames": 0,
                                        "invalidFrames": 0,
                                        "score": vu.sop.useGestures === 'mixedChallenge' ?
                                            convertFaceConfidence(eventData.debugEvaluation[1]) : 99 ,
                                        "approved": true}

      gestureFeedback.push(captureGestureDetailBody);

      captureSelfieSaveBody.detail = gestureFeedback;
  }
}

async function processTelemetryQueue() {

    while (telemetryQueue.length > 0 && vu.telemetry.traceId != null) {
        const telemetryData = telemetryQueue.shift();
        try {
            switch (telemetryData.activity) {
                case 'DocumentActivityProcess':
                    const documentLogResponse = await vu.sop.logApi.saveDocumentLog(telemetryData.eventData);
                    console.log(documentLogResponse);
                    break;
                case 'SelfieActivityProcess':
                    const selfieLogResponse = await vu.sop.logApi.saveSelfieLog(telemetryData.eventData);
                    console.log(selfieLogResponse);
                    break;
                default:
                    console.warn('Unsupported telemetry event:', telemetryData.activity);
                    break;
            }
        } catch (error) {
            console.error('Error sending telemetry data:', error);
            telemetryQueue.unshift(telemetryData);
            break;
        }
    }
}


vu.telemetry.initTraceId = async function () {
    let requestBody = { clientId: vu.sop.userNameValue,
                        platform: vu.sop.browserInfo.browserName}
    try{
    const response = await vu.sop.logApi.initTraceTransaction(requestBody);
    console.log(response);
    if(response.code === 2000){
        vu.telemetry.traceId = response.traceId;
    }else{
        vu.telemetry.traceId = null;
    }} catch (error) {
            console.error('Error generating traceId:', error);
            vu.telemetry.traceId = null; }
}

function getGestureCode(challengeName){
    let gestureCode = {
        'none': 'SN',
        'smile': 'SS',
        'eyeClose': 'SCE',
        'lookLeft': 'SML',
        'lookRight': 'SMR'

    };
    return gestureCode[challengeName] || 'NF';
}

function convertFaceConfidence(confidence) {
    let faceConfidence = parseFloat(confidence.replace('%', ''));
    if (!isNaN(faceConfidence)) {
        faceConfidence  = Math.round(faceConfidence);
        return faceConfidence;
    } else {
        return 0;
    }
}

function getCaptureResponseNumber(activity , screenId , eventType){

    if(eventType === "unload"){
        let code = {
            'DocumentActivityProcess': screenId === 1 ? vu.telemetry.captureResponseCode.FRONT.USER_CANCELLED :
                vu.telemetry.captureResponseCode.BACK.USER_CANCELLED,
            'SelfieActivityProcess': vu.telemetry.captureResponseCode.SELFIE.USER_CANCELLED,
        };
        return code[activity]

    }else if (eventType === "visibilitychange"){

        let code = {
            'DocumentActivityProcess': screenId === 1 ? vu.telemetry.captureResponseCode.FRONT.BACKGROUND_TASKING_ERROR :
                vu.telemetry.captureResponseCode.BACK.BACKGROUND_TASKING_ERROR,
            'SelfieActivityProcess': vu.telemetry.captureResponseCode.SELFIE.BACKGROUND_TASKING_ERROR,
        };
        return code[activity]
        
    }
}

window.addEventListener('unload', function(event) {
    saveEvent(event.type);
});


document.addEventListener("visibilitychange", function(event) {
    if (document.visibilityState === 'hidden') {
        saveEvent(event.type);
    }
});

function saveEvent(eventType) {
    if(telemetryStartEvent.length > 0){

        let captureResponseNumber = getCaptureResponseNumber(telemetryStartEvent[0].activity , telemetryStartEvent[0].eventData.screenId , eventType);

        let data = {...telemetryStartEvent[0].eventData ,
            'captureResponseNumber' : captureResponseNumber,
            'endAt': new Date(),
        }

        if(telemetryStartEvent[0].activity === "SelfieActivityProcess"){

            captureSelfieSaveBody = { "minimumValidGestures" : vu.face.ui.gestures.numOfChallenges,
                "validGestures": gestureFeedback.length,
                "invalidGestures": vu.face.ui.gestures.numOfChallenges - gestureFeedback.length ,
                "passedTest" : false,
                "detail" : gestureFeedback,}

            data = { ...data , ...captureSelfieSaveBody};

            vu.sop.logApi.doFetchRequest(data, '/selfie/saveLog');
        } else {
            vu.sop.logApi.doFetchRequest(data , '/document/saveLog');
        }
    }
}



if(vu.sop.enableTelemetry){
    const telemetryInterval = setInterval(processTelemetryQueue, 2000);
}
