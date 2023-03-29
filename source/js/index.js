import {fhirService} from './fhir.service.js';
import {Dialogs} from './dialogs.js';
import * as leftSideBar from './left-sidebar.js';
import * as formPane from './form-pane';
import {config} from './config.js';

/**
 * Get the connection to FHIR server and the selected patient
 * and retrieve all the DiagosticReport resources for this patient
 * Note: Here it gets all resources in one request without a search,
 * just to make a simple demo.
 */
function establishFHIRContext() {
  const params = (new URL(document.location)).searchParams;
  let fhirServerURL = params.get('server');
  let reviewQuestionnaire = params.get('reviewQuestionnaire');
  //hardcode fhirServerUtl instead of getting it from
  //fhirServerURL = config.fhirServerUrl; //for now comment to get inside if loop
  let submitElement = document.getElementById("createQRToFhir");
  if(reviewQuestionnaire) { //hide submit button when reviewing the questionnaire
    if(submitElement)
    submitElement.style.visibility = "hidden";
  } else {
    if(submitElement)
    submitElement.style.visibility = "visible";
  }
  if (fhirServerURL) {
    setServerAndPickPatient({url:fhirServerURL});
  }
  else {
    if (!fhirService.getSmartConnection() && !fhirService.smartConnectionInProgress()) {
      fhirService.requestSmartConnection(function(success) {
        if (success) {
          var smart = fhirService.getSmartConnection();
          const patientPromise = smart.patient.read().then(function (pt) {
            fhirService.setCurrentPatient(pt);
            leftSideBar.initSideBarLists();
          });
          const userPromise = smart.user.read().then(function(user) {
            fhirService.setCurrentUser(user);
          });
          Promise.all([patientPromise, userPromise]).then(function() {
            updateUserAndPatientBanner();
          }, function failed (msg) {
            console.log('Unable to read the patient and user resources.');
            console.log(msg);
            console.trace();
            showErrorMsg(msg);
          });
        }
        else {
          console.log("Could not establish a SMART connection.");
          selectServerAndPatient();
        }
      });
    }
  }
}

/**
 *  Updates the User and Patient info banner.
 */
function updateUserAndPatientBanner() {
  const patient = fhirService.getCurrentPatient();
  document.getElementById('ptName').innerText =
    'Patient: ' + fhirService.getPatientName();
  document.getElementById('ptGender').innerText =
    'Gender: ' + (patient.gender || '');
  document.getElementById('ptDoB').innerText =
    'DoB: ' + (patient.birthDate || '');
  document.getElementById('userName').innerText =
    'User: ' + fhirService.getUserName();
  document.querySelector('.lf-patient table').style.visibility = 'visible';
}

setTimeout(establishFHIRContext, 1);


/**
 *  Opens dialogs for selecting first a FHIR server and then a patient.
 */
function selectServerAndPatient() {
  // For now get the server from an URL parameter:
  let fhirServerURL;
  if (window.location.search && URLSearchParams) {
    // IE 11 does not support URLSearchParams.  Within a year, LForms won't
    // support IE 11 because of its dependency on Angular, so there I think
    // there is no need to support this feature here for IE 11.
    fhirServerURL = (new URLSearchParams(window.location.search)).get('server');
    fhirServerURL = config.fhirServerUrl;
  }
  fhirServerURL = config.fhirServerUrl;
  if (fhirServerURL) {
    setServerAndPickPatient({url: fhirServerURL});
    let questionnaireId = (new URLSearchParams(window.location.search)).get('questionnaireId');
    let subjectId = (new URLSearchParams(window.location.search)).get('subjectId');
    let questionnaireResponseId = (new URLSearchParams(window.location.search)).get('questionnaireResponseId');
    console.log("questionnaireId : " + questionnaireId);
    console.log("questionnaireResponseId : " + questionnaireResponseId);
    console.log("subjectId : " + subjectId);
    if(questionnaireId) {
      console.log("Show Questionnaire for QuestionnaireId: " + questionnaireId + " and SubjectId : " + subjectId) ;
      var subject =  '{"identifier": {"type": {"text": "' + subjectId + '"}}}';
      fhirService.setCurrentSubject(JSON.parse(subject));
      fhirService.setCurrentQuestionnaireId(questionnaireId);
      fhirService.getFhirResourceById('Questionnaire', questionnaireId)
      .then(function(questionnaire) {
        formPane.showForm(questionnaire, {prepopulate: true});
      }).catch(function(error) {
        console.error(error);
        if(error.data)
        console.error(error.data);
      });
    }else if(questionnaireResponseId) {
      console.log("Show Questionnaire Response for QuestionnaireResponseId: " + questionnaireResponseId) ;
      fhirService.getFhirResourceById('QuestionnaireResponse', questionnaireResponseId)
      .then(function(questionnaireResponse) {
        let questionnaireReq = null;
        questionnaireId = questionnaireResponse.questionnaire.replace("Questionnaire/", "");
        console.log("Retrieved questionnaireId ==>> " + questionnaireId);
        fhirService.getFhirResourceById('Questionnaire', questionnaireId)
            .then(function(questionnaire) {
              console.log("Retrieved questionnaire. Show form.");
              formPane.showForm(questionnaire, {prepopulate: true}, true, questionnaireResponse);
            }).catch(function(error) {
              console.error("Error retrieving Questionnaire. " + error);
              if(error.data)
              console.error(error.data);
            });
        //formPane.showForm(questionnaireReq, {prepopulate: true}, true, questionnaireResponse);
      }).catch(function(error) {
        console.error("Error retrieving Questionnaire Response. : " + error);
        if(error.data)
        console.error("Error QRID Data: " + error.data);
      });
    }
     else {
      console.log("pass param Questionnaire ID and SubjectId in the url");
    }
  }
  else {
    alert("No FHIR server. Please configure FHIR server")
   // Dialogs.showFHIRServerPicker();
  }
}


/**
 *  Establishes communication with the FHIR server at the given URL, and
 *  calls the given callback with a boolean indicating whether
 *  communication was successfully established.  If it was successful, a
 *  patient selection dialog will be opened.
 * @param fhirServer configuration of the FHIR server
 * @param callback the function to call after the communication attempt.
 *  It will be passed a boolean to indicate whether the attempt was
 *  successful.
 */
function setServerAndPickPatient(fhirServer, callback) {
  //I do not need to show the popup dialogue as FHIR server is hardcoded
  //showWaitMsg('Contacting FHIR server.  Please wait...');
  fhirService.setNonSmartServer(fhirServer, function(success) {
    if (callback)
      callback(success); // "success" is a boolean
    if (success) {
      let patientId = "pat-13964";
      /*fhirService.getFhirResourceById("Patient", patientId)
      .then(function(patientResource) {
      if (patientResource) {
        fhirService.setCurrentPatient(patientResource);
        fhirService.setNonSmartServerPatient(patientResource.id);
        leftSideBar.initSideBarLists();
        //updateUserAndPatientBanner(); //Marla does not want to show patient banner
      }
      });
/*       Dialogs.showPatientPicker().then((patientResource) => {
        if (patientResource) {
          fhirService.setCurrentPatient(patientResource);
          fhirService.setNonSmartServerPatient(patientResource.id);
          leftSideBar.initSideBarLists();
          updateUserAndPatientBanner();
        }
      }); */
    }
    else {
      showErrorMsg('Could not establish communication with the FHIR server at ' +
          fhirServer.url+'.');
    }
  });
}


/**
 *  Shows a "Please Wait" message.
 * @param msg The message to show.
 */
function showWaitMsg(msg) {
  showMsg('Please Wait', msg);
};

/**
 *  Shows a error message.
 * @param msg The message to show.
 */
function showErrorMsg(msg) {
  showMsg('Error', msg);
};


/**
 *  Shows a message (text only).
 * @param title The heading for the message.
 * @param msg The message to show.
 */
function showMsg(title, msg) {
  Dialogs.showMsgDialog(title, msg);
};



