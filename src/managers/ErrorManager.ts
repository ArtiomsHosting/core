export type ApiErrorContext = {
    message: string;
    context?: { [key: string]: any };
};

export abstract class ApiError extends Error {
    abstract readonly statusCode: number;
    readonly logging: boolean;
    readonly context: { [key: string]: any };

    constructor(
        message: string,
        {
            logging = false,
            context = {},
        }: {
            logging?: boolean;
            context?: { [key: string]: any };
        } = {}
    ) {
        super(message);

        this.logging = logging;
        this.context = context;

        Object.setPrototypeOf(this, ApiError.prototype);
    }

    get errors(): ApiErrorContext[] {
        return [{ message: this.message, context: this.context }];
    }
}

export class BadRequestError extends ApiError {
    readonly statusCode = 400;

    constructor(params?: {
        message?: string;
        logging?: boolean;
        context?: { [key: string]: any };
    }) {
        super(params?.message || "Bad request", params);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
}

export class UnauthorizedError extends ApiError {
    readonly statusCode = 401;

    constructor(params?: {
        message?: string;
        logging?: boolean;
        context?: { [key: string]: any };
    }) {
        super(params?.message || "Unauthorized", params);
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}

export class ForbiddenError extends ApiError {
    readonly statusCode = 403;

    constructor(params?: {
        message?: string;
        logging?: boolean;
        context?: { [key: string]: any };
    }) {
        super(params?.message || "Forbidden", params);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}

export class NotFoundError extends ApiError {
    readonly statusCode = 404;

    constructor(params?: {
        message?: string;
        logging?: boolean;
        context?: { [key: string]: any };
    }) {
        super(params?.message || "Resource not found", params);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class UnprocessableEntityError extends ApiError {
    readonly statusCode = 422;

    constructor(params?: {
        message?: string;
        logging?: boolean;
        context?: { [key: string]: any };
    }) {
        super(params?.message || "Unprocessable Entity", params);
        Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
    }
}

export class TooManyRequestsError extends ApiError {
    readonly statusCode = 429;

    constructor(params?: {
        message?: string;
        logging?: boolean;
        context?: { [key: string]: any };
    }) {
        super(params?.message || "Too Many Requests", params);
        Object.setPrototypeOf(this, TooManyRequestsError.prototype);
    }
}

export class InternalServerError extends ApiError {
    readonly statusCode = 500;

    constructor(params?: {
        message?: string;
        logging?: boolean;
        context?: { [key: string]: any };
    }) {
        super(params?.message || "Internal server error", params);
        Object.setPrototypeOf(this, InternalServerError.prototype);
    }
}

export class ServiceUnavailableError extends ApiError {
    readonly statusCode = 503;

    constructor(params?: {
        message?: string;
        logging?: boolean;
        context?: { [key: string]: any };
    }) {
        super(params?.message || "Service Unavailable", params);
        Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
    }
}

export class NotImplementedError extends ApiError {
    readonly statusCode = 501;

    constructor(params?: {
        message?: string;
        logging?: boolean;
        context?: { [key: string]: any };
    }) {
        super(
            params?.message || "This feature is not implemented yet.",
            params
        );
        Object.setPrototypeOf(this, NotImplementedError.prototype);
    }
}
