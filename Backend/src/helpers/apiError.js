export default class ApiError extends Error {
  constructor(statusCode, statusMessage, errorCode = null) {
    super(statusMessage);
    this.statusCode = statusCode;
    this.message = statusMessage;
    this.errorCode = errorCode;
  }
}
