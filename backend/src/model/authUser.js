const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    currentChallenge: { type: String },
    registrationInProgress: { type: Boolean, default: false },
    credentials: [{
        credentialID: { type: String }, // Changed to not required
        credentialPublicKey: { type: Buffer }, // Changed to not required
        counter: { type: Number }, // Changed to not required
        transports: { type: [String] }
    }]
}, { strict: false }); // Added strict:false to allow flexible saving during registration

module.exports = mongoose.model('authUsers', userSchema);