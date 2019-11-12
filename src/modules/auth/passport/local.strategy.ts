import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { Model, Connection } from 'mongoose';
import { use } from 'passport';
import { Strategy } from 'passport-local';

import { IUser } from '../../users/interfaces/user.interface';
import { UserSchema } from '../../users/schemas/user.schema';

import { generateHashedPassword, generateSalt } from '../../../utilities/encryption';
import { MESSAGES, USER_MODEL_TOKEN, DB_CONNECTION_TOKEN } from '../../../server.constants';

import { Request } from 'express';

@Injectable()
export class LocalStrategy {
    private userModel;
    constructor() {
        this.init();
    }

    private init(): void {
        use('local-signin', new Strategy({
            passReqToCallback: true,
            usernameField: 'email',
            passwordField: 'password'
        }, async (req: Request, email: string, password: string, done: Function) => {
            try {

                const db = req['dbConnection'];
                this.userModel = db.model(USER_MODEL_TOKEN, UserSchema) as Model<IUser>;
                const user = await this.userModel.findOne({ email });
                if (!user) {
                    return done(new UnauthorizedException(MESSAGES.UNAUTHORIZED_INVALID_EMAIL), false);
                }

                if (!user.authenticate(password)) {
                    return done(new UnauthorizedException(MESSAGES.UNAUTHORIZED_INVALID_PASSWORD), false);
                }

                done(null, user);
            } catch (error) {
                done(error, false);
            }
        }));
    }
}
