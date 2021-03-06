import { Schema, model } from 'mongoose';
import { IUser } from '../interfaces/user.interface';
import { generateHashedPassword, generateSalt, generateRandomToken } from '../../../utilities/encryption';

const illegalUsernames: string[] = ['meanjs', 'administrator', 'password', 'admin', 'user', 'unknown', 'anonymous', 'null', 'undefined', 'api'];

console.log('Loading user Schema');

export const UserSchema: Schema = new Schema({
    created: {
        type: Date,
        default: new Date()
    },
    firstName: {
        type: String,
        required: 'First name is required'
    },
    lastName: {
        type: String,
        required: 'Last name is required'
    },
    displayName: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        index: {
            unique: true,
            sparse: true // For this to work on a previously indexed field, the index must be dropped & the application restarted.
        },
        lowercase: true,
        trim: true,
    },
    username: {
        type: String,
        unique: 'Username already exists',
        required: 'Please fill in a username',
        validate: [validateUsername,
            'Please enter a valid username: 3+ characters long, non restricted word, characters "_-.",' +
            ' no consecutive dots, does not begin or end with dots, letters a-z and numbers 0-9.'],
        lowercase: true,
        trim: true
    },
    active: {
        type: Boolean,
        default: true
    },
    password: {
        type: String,
        default: ''
    },
    profileImageURL: {
        type: String,
        default: '/modules/users/client/img/profile/default.png'
    },
    salt: {
        type: String
    },
    provider: {
        type: String,
        required: 'Provider is required'
    },
    providerData: {},
    additionalProvidersData: {},
    roles: {
        type: [{
            type: String,
            enum: ['user', 'admin']
        }],
        default: ['user'],
        required: 'Please provide at least one role'
    },
    userType: {
        type: String,
        enum: ['employee', 'employer'],
        default: 'employee'
    },
    updated: {
        type: Date
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    /* For reset password */
    resetPasswordToken: {
        type: String,
        default: null
    },
    verificationToken: {
        type: String,
        default: generateRandomToken()
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    }
});

UserSchema.pre<IUser>('save', function(next) {
    if (this.isNew) {
        this['wasNew'] = this.isNew;
    }

    if (this.password && this.isModified('password')) {
        this.salt = generateSalt();
        this.password = generateHashedPassword(this.salt, this.password);
    }
    next();
});

UserSchema.post('save', async function(user) {
    if (this.wasNew) {
        console.log('post save here');

    }
});

/*UserSchema.methods.authenticate = function (password) {
    console.log('hodas');
};
*/
UserSchema.methods.authenticate = function (password) {
    return this.password === generateHashedPassword(this.salt, password);
};


//  Patch function created
UserSchema.methods.patch = async function(body) {
    console.log(body);
    const user = Object.assign(this, body);
    return await user.save();
};

function validateUsername(username) {
    const usernameRegex = /^(?=[\w.-]+$)(?!.*[._-]{2})(?!\.)(?!.*\.$).{3,34}$/;
    return (
        this.provider !== 'local' ||
        (username && usernameRegex.test(username) && illegalUsernames.indexOf(username) < 0)
    );
}

