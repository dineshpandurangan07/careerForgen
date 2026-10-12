export class ApiError extends Error {
  status: number;
  errorCode: string;

  constructor(status: number, message: string, errorCode = "error") {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }

  static badRequest(message = "Bad request", code = "bad_request") {
    return new ApiError(400, message, code);
  }
  static unauthorized(message = "Not signed in", code = "unauthorized") {
    return new ApiError(401, message, code);
  }
  static forbidden(message = "Not allowed", code = "forbidden") {
    return new ApiError(403, message, code);
  }
  static notFound(message = "Not found", code = "not_found") {
    return new ApiError(404, message, code);
  }
  static conflict(message = "Conflict", code = "conflict") {
    return new ApiError(409, message, code);
  }
  static tooMany(message = "Too many requests", code = "rate_limited") {
    return new ApiError(429, message, code);
  }
}
