import path from "path";
import { inject, injectable } from "tsyringe";
import { v4 as uuidV4 } from "uuid";

import { IUsersRepository } from "@modules/accounts/repositories/IUsersRepository";
import { IUsersTokensRepository } from "@modules/accounts/repositories/IUsersTokensRepository";
import { IDateProvider } from "@shared/container/providers/DateProvider/IDateProvider";
import {
  IMailProvider,
  IMailVariables
} from "@shared/container/providers/MailProvider/IMailProvider";
import { AppError } from "@shared/errors/AppError";

@injectable()
class SendForgotPasswordMailUseCase {
  constructor(
    @inject("UsersRepository")
    private usersRepository: IUsersRepository,

    @inject("UsersTokensRepository")
    private usersTokensRepository: IUsersTokensRepository,

    @inject("DayjsDateProvider")
    private dateProvider: IDateProvider,

    @inject("MailProvider")
    private mailProvider: IMailProvider
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);
    const templatePath = path.resolve(
      __dirname,
      "..",
      "..",
      "views",
      "emails",
      "forgotPassword.hbs"
    );

    if (!user) {
      throw new AppError("User does not exists!");
    }

    const token = uuidV4();
    const expires_date = this.dateProvider.addHours(3);

    await this.usersTokensRepository.create({
      expires_date,
      refresh_token: token,
      user_id: user.id
    });

    const variables: IMailVariables = {
      name: user.name,
      link: `${process.env.FORGOT_MAIL_URL}${token}`
    };

    await this.mailProvider.sendMail(
      email,
      "Password recovery",
      variables,
      templatePath
    );
  }
}

export { SendForgotPasswordMailUseCase };
