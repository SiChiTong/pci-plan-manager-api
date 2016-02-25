var restful = require('node-restful');
var mongoose = restful.mongoose;
var bcrypt = require('bcrypt-nodejs');

var tokenSchema = require('./token');

function createToken (callback) {
    require('crypto').randomBytes(128, function(ex, buf) {
        var token = buf.toString('hex');
        callback(token);
    });
}

function addMinutes(date, minutes) {
    return new Date(date.getTime() + (minutes * 60000));
}

var userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type : String , unique : true, required : true, dropDups: true },
    password: String,
    token: tokenSchema,
    plans: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Plan',
        unique: true,
        dropDups: true,
    }],
    sessions: [{
        ip: String,
        start: Date,
        end: Date,
    }],
    isAdmin: Boolean,
    isActive: Boolean,
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        unique: false,
        dropDups: false,
    },
    createdOn: Date,
    modifiedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        unique: false,
        dropDups: false,
    },
    modifiedOn: Date,
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.get("password"));
}

userSchema.methods.generateToken = function(callback) {
    createToken(function (tokenValue) {
        this.token.value = bcrypt.hashSync(tokenValue, bcrypt.genSaltSync(8), null);
        this.token.createdOn = Date.now();
        this.save(function (err) {
            if (err) { console.log(err); }
        });
        callback(tokenValue);
    }.bind(this));
}

userSchema.methods.isValidToken = function (token) {
    var isCorrectToken = bcrypt.compareSync(token, this.get("token.value"));
    var isNotExpired = (addMinutes(this.token.createdOn, 60) > Date.now());
    return (isCorrectToken && isNotExpired);
}

userSchema.statics.getUserFromEmail = function (email, callback) {
    this.findOne({ "email" : email }, function (error, object) {
        if (error) {
            console.log(error);
        }
        callback(object);
    });
}

userSchema.statics.getUserAndValidate = function (email, token, callback) {
    this.findOne({
        "email": email
    }, function(err, user) {
        if (err) {
            console.log(err);
        }
        if (!user) {
            return callback(null);
        } else if (user) {
            if (!user.isValidToken(token)) {
                return callback(null);
            } else {
                return callback(user);
            }
        }
    });
}

module.exports = restful.model('User', userSchema);