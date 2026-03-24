import 'server-only';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN en las variables de entorno');
}

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken,
  options: {
    timeout: 5000,
  },
});

export const preferenceClient = new Preference(mercadoPagoClient);