const mongoose = require('mongoose');
const connect = mongoose.connect("mongodb+srv://miguelrecinostab:tC1Ec5mmMEAUU1VQ@cluster0.gke5m.mongodb.net/test");

// Create Schema
const tareaSchema = new mongoose.Schema({
    titulo: {
        type:String,
        required: true
    },
    completado: {
        type:Boolean,
    }
});

// collection part
const Tarea = mongoose.model("Tarea", tareaSchema);

module.exports = Tarea;