var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    nome: {
        unique: true,
        type: String,
        required: true
    },
    senha: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'user'   // 'user' ou 'adm'
    }
},
    {
        versionKey: false
    }
);

module.exports = mongoose.model('User', userSchema);
