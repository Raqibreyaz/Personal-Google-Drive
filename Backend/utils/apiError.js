export default class ApiError extends Error {
  constructor(statusCode, statusMessage) {
    super(statusMessage);
    this.statusCode = statusCode;
    this.message = statusMessage;
  }
}
