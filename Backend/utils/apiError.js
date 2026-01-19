export default class ApiError extends Error {
  constructor(statusCode, statusMessage) {
    this.statusCode = statusCode;
    this.message = statusMessage;
  }
}
