// serverBolsa/test/authenticate.test.js
// Cobertura unitaria del middleware JWT. Sin base de datos, sin red y sin mocking:
// `req`, `res` y `next` se inyectan como argumentos, por eso no hace falta mock.module.
//
// IMPORTANTE: los dos mensajes de rechazo significan cosas distintas y ambos deben
// seguir siendo distinguibles.
//   - "No token provided" -> la peticion NO llevo segundo segmento en la cabecera.
//   - "Invalid token"      -> si lo llevo, pero no se pudo verificar.
// authenticate.js:7 toma el token como `authorization?.split(' ')[1]`, asi que una
// cabecera sin segundo segmento nunca llega siquiera a jwt.verify.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import authenticate from '../middlewares/authenticate.js';
import { signToken, makeReq, runAuthenticate } from './helpers/request.js';

// Todo caso pasa por `await runAuthenticate(...)`; ninguno lee la grabacion en el
// mismo tick que la invocacion. El await es una garantia de contrato (el middleware
// termina consolidandose), no una correccion de una condicion de carrera. Ver design D3.
describe('middlewares/authenticate', () => {
  describe('token ausente', () => {
    const SIN_SEGMENTO = [
      ['la cabecera authorization no existe', undefined],
      ['la cabecera es una cadena vacia', ''],
      ['la cabecera solo tiene espacios', '   '],
      ['la cabecera es "Bearer" sin token', 'Bearer'],
      ['la cabecera es "BearerXYZ" sin token', 'BearerXYZ'],
    ];

    for (const [nombre, cabecera] of SIN_SEGMENTO) {
      test(`rechaza con 401 "No token provided" cuando ${nombre}`, async () => {
        const { res, calls } = await runAuthenticate(authenticate, makeReq(cabecera));
        assert.equal(res.statusCode, 401);
        assert.deepEqual(res.body, { message: 'No token provided' });
        assert.equal(calls.next, 0);
      });
    }

    test('rechaza con 401 "No token provided" cuando hay dos espacios tras el esquema', async () => {
      // 'Bearer  <token>' se divide en ['Bearer', '', '<token>']: el segundo segmento
      // es la cadena vacia, que es falsa. Es un caso de token AUSENTE, no invalido.
      const token = signToken({ _id: 'u1' });
      const { res, calls } = await runAuthenticate(authenticate, makeReq(`Bearer  ${token}`));
      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, { message: 'No token provided' });
      assert.equal(calls.next, 0);
    });
  });

  describe('token invalido', () => {
    test('rechaza con 401 "Invalid token" un token firmado con otro secreto', async () => {
      signToken({ _id: 'u1' }); // fija process.env.TOKEN_SECRET en el secreto de la suite
      const ajeno = jwt.sign({ _id: 'u1' }, 'un-secreto-distinto');
      const { res, calls } = await runAuthenticate(authenticate, makeReq(`Bearer ${ajeno}`));
      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, { message: 'Invalid token' });
      assert.equal(calls.next, 0);
    });

    test('rechaza con 401 "Invalid token" una cadena que no es un JWT', async () => {
      const { res, calls } = await runAuthenticate(authenticate, makeReq('Bearer esto-no-es-un-jwt'));
      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, { message: 'Invalid token' });
      assert.equal(calls.next, 0);
    });

    test('rechaza con 401 "Invalid token" un token correctamente firmado pero caducado', async () => {
      const caducado = signToken({ _id: 'u1' }, { expiresIn: -10 });
      const { res, calls } = await runAuthenticate(authenticate, makeReq(`Bearer ${caducado}`));
      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, { message: 'Invalid token' });
      assert.equal(calls.next, 0);
    });
  });

  describe('token valido', () => {
    test('autoriza y copia decoded._id a req.usuarioId', async () => {
      const token = signToken({ _id: 'u42' });
      const { req, res, calls } = await runAuthenticate(authenticate, makeReq(`Bearer ${token}`));
      assert.equal(req.usuarioId, 'u42');
      assert.equal(calls.next, 1);
      assert.equal(res.statusCode, null); // no se escribio ningun 401
    });

    // Comportamiento OBSERVADO, no un contrato respaldado. El middleware no valida el
    // esquema de la cabecera. Se afirma aqui para que anadir esa validacion en el futuro
    // se lea como un cambio de comportamiento deliberado y visible, y no como una
    // regresion silenciosa.
    test('autoriza con esquema "Token" porque el esquema no se valida (observado)', async () => {
      const token = signToken({ _id: 'u42' });
      const { req, res, calls } = await runAuthenticate(authenticate, makeReq(`Token ${token}`));
      assert.equal(req.usuarioId, 'u42');
      assert.equal(calls.next, 1);
      assert.equal(res.statusCode, null);
    });

    test('autoriza con esquema "BearerXYZ" porque el esquema no se valida (observado)', async () => {
      const token = signToken({ _id: 'u42' });
      const { req, res, calls } = await runAuthenticate(authenticate, makeReq(`BearerXYZ ${token}`));
      assert.equal(req.usuarioId, 'u42');
      assert.equal(calls.next, 1);
      assert.equal(res.statusCode, null);
    });
  });

  test('distingue el mensaje de token ausente del mensaje de token invalido', async () => {
    const ausente = await runAuthenticate(authenticate, makeReq(undefined));
    const invalido = await runAuthenticate(authenticate, makeReq('Bearer esto-no-es-un-jwt'));
    assert.deepEqual(ausente.res.body, { message: 'No token provided' });
    assert.deepEqual(invalido.res.body, { message: 'Invalid token' });
    assert.notDeepEqual(ausente.res.body, invalido.res.body);
  });
});
