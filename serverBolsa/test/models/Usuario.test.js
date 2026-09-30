// serverBolsa/test/models/Usuario.test.js
// Cobertura del modelo Usuario sin base de datos: se construyen documentos y se
// validan de forma sincrona mientras mongoose.connection.readyState === 0.
//
// IMPORTANTE — el hash NO es puro JS. `models/Usuario.js:2` importa 'bcrypt', que es
// un addon NATIVO (bcrypt@5.1.1) y no el 'bcryptjs' declarado en package.json. Este
// archivo importa 'bcrypt' a proposito, el mismo modulo que importa el modelo, para
// construir el hash real. No se sustituye, no se hace shim, no se mockea y no se usa
// bcryptjs como suplente. Si algun dia bcrypt deja de resolverse, la suite debe
// fallar en voz alta con ERR_MODULE_NOT_FOUND nombrando 'bcrypt' (design D5).
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Usuario from '../../models/Usuario.js';

const COMPLETO = { nombre: 'Ana', email: 'ana@example.com', password: 'en-plano' };

describe('models/Usuario', () => {
  test('esta registrado sobre la coleccion "usuarios"', () => {
    // El nombre viene del registro del modelo, no de una opcion del schema.
    assert.equal(Usuario.collection.name, 'usuarios');
  });

  test('un documento completo no produce error de validacion', () => {
    assert.equal(new Usuario(COMPLETO).validateSync(), undefined);
  });

  test('nombre, email y password son obligatorios uno por uno', () => {
    const { nombre, ...sinNombre } = COMPLETO;
    const { email, ...sinEmail } = COMPLETO;
    const { password, ...sinPassword } = COMPLETO;

    assert.equal(new Usuario(sinNombre).validateSync().errors.nombre.kind, 'required');
    assert.equal(new Usuario(sinEmail).validateSync().errors.email.kind, 'required');
    assert.equal(new Usuario(sinPassword).validateSync().errors.password.kind, 'required');
  });

  test('un documento vacio reporta "required" en los tres paths', () => {
    const errores = Object.keys(new Usuario({}).validateSync().errors).sort();
    assert.deepEqual(errores, ['email', 'nombre', 'password']);
  });

  test('el schema declara exactamente un indice unico sobre email', () => {
    const indices = Usuario.schema.indexes();
    assert.equal(indices.length, 1);
    assert.deepEqual(indices[0][0], { email: 1 });
    assert.equal(indices[0][1].unique, true);
  });

  test('comparePassword acepta la clave correcta y rechaza cualquier otra', () => {
    // comparePassword delega en bcrypt.compareSync, asi que devuelve un booleano de
    // forma sincrona. No se abre conexion ni cursor en ninguno de los dos casos.
    const hash = bcrypt.hashSync('la-clave-correcta', 10);
    const usuario = new Usuario({ ...COMPLETO, password: hash });

    assert.equal(usuario.comparePassword('la-clave-correcta'), true);
    assert.equal(usuario.comparePassword('una-clave-distinta'), false);
  });

  test('la conexion sigue desconectada durante toda la suite', () => {
    assert.equal(mongoose.connection.readyState, 0);
  });
});
