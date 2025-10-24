import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  scopes?: string[];
}

export const extractScopes = (req: AuthRequest, res: Response, next: NextFunction) => {
  const scopesHeader = req.headers['x-user-scopes'] as string;
  req.scopes = scopesHeader ? scopesHeader.split(' ') : [];
  next();
};

export const requireScope = (requiredScope: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.scopes || !req.scopes.includes(requiredScope)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Required scope: ${requiredScope}` 
      });
    }
    next();
  };
};
