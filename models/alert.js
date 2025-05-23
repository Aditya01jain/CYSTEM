
const mongoose = require('mongoose');
const Alert = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Title is required'],
        maxlength: 70,
    },
    ai_repsonse: {
        type: String,
        trim: true
    },
    critical:{
        type: String,
        trim: true,
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model("Alert", Alert);