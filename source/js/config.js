// Configuration for the app.

export const config = {
  /**
   *  The ID of the element on the page where the form is rendered.
   */
  formContainer: 'formContainer',
  //fhirServerUrl: 'http://ec2-3-136-234-37.us-east-2.compute.amazonaws.com:8080/fhir'
  //fhirServerUrl: 'https://lforms-fhir.nlm.nih.gov/baseR4/'
  fhirServerUrl: 'http://100.92.2.230:8090/fhir',
  //fhirServerUrl: 'http://100.92.3.16:8090/fhir',
    /**
   * Whether to try to resend a request without Cache-Control if a request with
   * Cache-Control returns an error.
   */
  retryWithoutCacheControl: true
};
