const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const kayttajatSchema = new Schema({
    //id: { type: Int16Array },
    nimi: { type: String },
    puhnum: { type: String },
    sposti: { type: String },
    kayttajatunnus: { type: String },
    //adminoikeudet: { type: Boolean, default: false }
});

const tuoteSchema = new Schema({
    nimi: { type: String, required: true },
    lahtohinta: { type: Number, required: true },
    hintavaraus: { type: Number },
    kuva: { type: String }
});

const kategoriaSchema = new Schema({
    selite: { type: String, required: true }
});


const Kayttaja = mongoose.model('Kayttaja', kayttajatSchema, 'kayttajat');
const Tuote = mongoose.model('Tuote', tuoteSchema, 'tuotteet');
const Kategoria = mongoose.model('Kategoria', kategoriaSchema, 'kategoriat');

module.exports = {
    Kayttaja,
    Tuote,
    Kategoria
};