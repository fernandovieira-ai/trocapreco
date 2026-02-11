const express = require('express');
const axios = require('axios');
const app = express();

exports.geoService = async (req, res) => {
    const origemLatitude = -17.554849;
    const origemLongitude = -52.554386;

    const { destinoLatitude, destinoLongitude } = req.body; // Captura dados do corpo da requisição
    const apiKey = 'AIzaSyD2sjfs3Z8-kDkpqzy0ZW5SMKflUYEP2bg';

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origemLatitude},${origemLongitude}&destination=${destinoLatitude},${destinoLongitude}&key=${apiKey}`;

    try {
        // Chamada à API do Google Maps Directions
        const response = await axios.get(url);

        // Verifica se há uma rota válida e retorna a distância em quilômetros
        if (response.data && response.data.routes.length > 0) {
            const distanciaMetros = response.data.routes[0].legs[0].distance.value; // Em metros
            const distanciaKm = distanciaMetros / 1000; // Converte para quilômetros
            const endDestino = response.data.routes[0].legs[0].end_address;


            res.status(200).json({
                message: distanciaKm,
                message1: endDestino
            });
        } else {
            res.status(500).json({
                message: 'Rota não encontrada ou dados inválidos na resposta da API do Google Maps'
            });
        }

    } catch (error) {
        console.error('Erro ao obter dados da API do Google Maps:', error.message);
        res.status(500).json({
            message: 'Erro ao obter dados da API do Google Maps',
            error: error.message
        });
    }
};

