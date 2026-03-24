import 'server-only';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const getAccessToken = () => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN en las variables de entorno');
  }

  return accessToken;
};

const createMercadoPagoClient = () =>
  new MercadoPagoConfig({
    accessToken: getAccessToken(),
    options: {
      timeout: 5000,
    },
  });

export const getPreferenceClient = () => {
  const mercadoPagoClient = createMercadoPagoClient();
  return new Preference(mercadoPagoClient);
};
