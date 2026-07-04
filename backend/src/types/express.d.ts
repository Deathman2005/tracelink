declare namespace Express {
  interface Request {
    cookies?: Record<string, string>;
    user?: {
      userId: string;
    };
  }
}
