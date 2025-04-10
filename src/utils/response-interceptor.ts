import { Request, Response, NextFunction } from "express";

export interface ApiResponseFormat<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  error: string | null;
  statusCode: number;
}

export class ResponseInterceptor {
  public intercept(req: Request, res: Response, next: NextFunction): void {
    const originalJson = res.json;
    const originalSend = res.send;

    res.json = function (body: unknown): Response {
      try {
        if (body && typeof body === "object" && !("success" in body && "data" in body && "message" in body)) {
          const statusCode = res.statusCode || 200;
          const isSuccess = statusCode >= 200 && statusCode < 400;

          const formattedResponse: ApiResponseFormat = {
            success: isSuccess,
            data: isSuccess ? body : null,
            message: isSuccess ? "Operación exitosa" : "Error en la operación",
            error: isSuccess ? null : typeof body === "string" ? body : JSON.stringify(body),
            statusCode,
          };

          return originalJson.call(res, formattedResponse);
        }
      } catch {
        return originalJson.call(res, body);
      }

      return originalJson.call(res, body);
    };

    res.send = function (body: unknown): Response {
      if (body !== null && typeof body === "object") {
        return res.json(body);
      }
      return originalSend.call(res, body);
    };

    next();
  }

  public static getMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    const interceptor = new ResponseInterceptor();
    return interceptor.intercept.bind(interceptor);
  }
}

export const responseInterceptor = ResponseInterceptor.getMiddleware();
