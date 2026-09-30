// serverBolsa/test/helpers/request.js
// Fábricas puras para la suite de serverBolsa. Sin efectos secundarios al importar:
// `node --test` ejecuta TODO archivo .js dentro de un directorio test/ como archivo de
// prueba (design D2), asi que este modulo tambien se ejecutara. Solo declara e importa.
import jwt from 'jsonwebtoken';

/** Secreto usado por la suite. Se asigna a process.env en cada llamada (design D4). */
export const TEST_SECRET = 'test-secret';

/**
 * Firma un payload con el `jsonwebtoken` real que usa el middleware.
 * Asigna process.env.TOKEN_SECRET ANTES de firmar, porque authenticate.js lo lee en
 * tiempo de llamada, no de importacion: asi el orden de importacion es irrelevante.
 * @param {object} payload  claims del JWT, p. ej. { _id: 'u42' }
 * @param {object} [options] opciones de jsonwebtoken, p. ej. { expiresIn: -10 }
 * @returns {string} un JWT codificado
 */
export function signToken(payload, options) {
  process.env.TOKEN_SECRET = TEST_SECRET;
  return jwt.sign(payload, TEST_SECRET, options);
}

/**
 * `req` minimo. Pasar `undefined` omite la cabecera por completo, caso distinto
 * de una cadena vacia.
 * @param {string} [authorization]
 * @returns {{ headers: object, usuarioId?: string }}
 */
export function makeReq(authorization) {
  const req = { headers: {} };
  if (authorization !== undefined) req.headers.authorization = authorization;
  return req;
}

/**
 * `res` encadenable. `res.status(401).json(body)` devuelve el mismo fake y graba
 * tanto el codigo como el cuerpo.
 * @param {() => void} [onSettled] invocado despues de que json() grabe su payload
 */
export function makeRes(onSettled = () => {}) {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; onSettled(); return this; },
  };
}

/**
 * Ejecuta `authenticate` y resuelve cuando el middleware se haya consolidado: en
 * res.json() si rechaza, o en next() si autoriza. Resolver con lo que ocurra primero
 * es obligatorio: esperar solo a next() se deadlockea en el rechazo y esperar solo a
 * json() se deadlockea en el exito.
 *
 * El await que hace el test sobre esta promesa es una garantia de contrato, no una
 * correccion de condicion de carrera: en jsonwebtoken@9.0.2 el callback se invoca de
 * forma sincrona en todos los caminos. Ver design D3.
 * @returns {Promise<{ req: object, res: object, calls: { next: number } }>}
 */
export function runAuthenticate(authenticate, req) {
  const calls = { next: 0 };
  let settle;
  const settled = new Promise((resolve) => { settle = resolve; });
  const res = makeRes(() => settle());
  authenticate(req, res, () => { calls.next += 1; settle(); });
  return settled.then(() => ({ req, res, calls }));
}
