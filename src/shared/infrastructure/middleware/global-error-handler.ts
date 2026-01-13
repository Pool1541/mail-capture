/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextFunction, Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { BaseApplicationError } from "../../domain/errors/base-application-error";

export function globalErrorHandler(error: unknown, req: Request, res: Response, next: NextFunction): void {
  // Manejar errores de la aplicación
  if (error instanceof BaseApplicationError) {
    console.error(`[${error.module}] ${error.constructor.name}:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack,
      url: req.url,
      method: req.method,
    });

    // Solo reportar a Sentry errores del servidor (>= 500)
    if (error.httpStatus >= 500) {
      Sentry.captureException(error, {
        extra: {
          module: error.module,
          code: error.code,
          details: error.details,
          url: req.url,
          method: req.method,
        },
      });
    }

    res.status(error.httpStatus).json({
      error: {
        code: error.code,
        message: error.message,
        ...(process.env.NODE_ENV === "development" && {
          details: error.details,
          stack: error.stack,
          module: error.module,
        }),
      },
    });
    return;
  }

  // Manejar errores nativos de JavaScript (siempre son 500)
  if (error instanceof Error) {
    console.error("Unhandled Error:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
    });

    // Reportar errores inesperados a Sentry
    Sentry.captureException(error, {
      extra: {
        url: req.url,
        method: req.method,
      },
    });

    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
        ...(process.env.NODE_ENV === "development" && {
          stack: error.stack,
        }),
      },
    });
    return;
  }

  // Manejar otros tipos de errores (siempre son 500)
  console.error("Unknown Error:", {
    error,
    url: req.url,
    method: req.method,
  });

  // Reportar errores desconocidos a Sentry
  Sentry.captureException(error, {
    extra: {
      url: req.url,
      method: req.method,
    },
  });

  res.status(500).json({
    error: {
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
    },
  });
}
