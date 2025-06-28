import { createClient } from "@supabase/supabase-js";
import { NextFunction, Request, Response } from "express";

import { type Database } from "@/shared/infrastructure/types/supabase";

import { FindUserByEmail } from "../application/use-cases/find-user-by-email";
import { UserNotFoundError } from "../domain/errors/user-not-found";
import { SupabaseUserRepository } from "./repositories/supabase-user-repository";

export class ExpressUserController {
  async findByEmail(req: Request, res: Response, next: NextFunction) {
    const { email } = req.params;
    const jwt = req.token;

    const supabase = createClient<Database>(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_ANON_KEY ?? "", {
      global: { headers: { Authorization: `Bearer ${jwt ?? ""}` } },
    });
    const userRepository = new SupabaseUserRepository(supabase);
    const findUserByEmail = new FindUserByEmail(userRepository);

    try {
      const user = await findUserByEmail.execute(email);
      return res.status(200).json(user);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return res.status(404).json({ message: "User not found" });
      }

      next(error);
    }
  }
}
