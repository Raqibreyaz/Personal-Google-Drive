export default class ApiError extends Error {
  constructor(statusCode, statusMessage, errorCode = "UNKNOWN_ERROR") {
    super(statusMessage);
    this.statusCode = statusCode;
    this.message = statusMessage;
    this.errorCode = errorCode;
  }
}
