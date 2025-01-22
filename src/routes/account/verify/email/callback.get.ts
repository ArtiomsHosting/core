import Joi from "joi";
import { User, VerificationToken } from "~/lib";
import { validate } from "~/middlewares/validate";
import { ApiHandler } from "~/utils/types";

const SCHEMA = {
    query: {
        code: Joi.string().required(),
    },
};

export const preHandlers = [validate(SCHEMA)] as const;

export const handler: ApiHandler<typeof preHandlers> = async (req, res) => {
    const token = await VerificationToken.findByToken(req.query.code);

    if (!token || token.isExpired()) {
        res.send(`<h1>This token has expired. Request a new one</h1>`);
        return;
    }

    const user = await User.findById(token.userId);

    /** @description Impossible to get since verification codes are onDelete Cascade */
    if (!user) {
        res.send(
            `<h1>Achivement unlocked: How did we get here?</h1>` +
                `<p>` +
                `So here's the tale: A user signed up, requested an email verification link, and then, in an unexpected plot twist, decided to delete their account.  ` +
                `Now, fast forward to this very moment—they clicked the verification link... but here's the catch: Their account was already gone! ` +
                `No record, no trace, nothing. It's like they vanished into thin air. What a long journery... ` +
                `</p>`
        );
        return;
    }

    await token.delete();
    await user.updateDetails({
        verified_email: new Date(),
    });

    res.send(
        `<h1>Email has successfully been verified</h1><p>You can now close this tab</p>`
    );
};
