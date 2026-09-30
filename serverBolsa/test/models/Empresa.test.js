// serverBolsa/test/models/Empresa.test.js
// Cobertura del modelo Empresa sin base de datos: se construyen documentos y se
// validan de forma sincrona mientras mongoose.connection.readyState === 0.
//
// Este archivo NO importa index.js ni websockets/websocketServer.js. Importar cualquiera
// de los dos abriria un socket en escucha, arrancaria el setInterval sin limpiar o
// iniciaria una peticion saliente, y el proceso de pruebas no terminaria solo (design D6).
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
// models/Empresa.js declara usuarioId con ref: 'Usuario', que mongoose resuelve POR
// NOMBRE de modelo. Este import debe quedar en el grafo de modulos de este mismo archivo
// para que 'Usuario' este registrado: cada archivo de pruebas corre en un grafo nuevo, y
// no se puede confiar en el orden de ejecucion entre archivos.
import Usuario from '../../models/Usuario.js';
import Empresa from '../../models/Empresa.js';

const USUARIO_ID = '507f1f77bcf86cd799439011';
const COMPLETO = { nombre: 'Telefonica', cantidad: 10, usuarioId: USUARIO_ID };

describe('models/Empresa', () => {
  test('esta registrado sobre la coleccion "empresas"', () => {
    // El nombre se pasa como tercer argumento de model() en Empresa.js:35, asi que es
    // una propiedad del REGISTRO. Afirmar una opcion del schema estaria afirmando otra cosa.
    assert.equal(Empresa.collection.name, 'empresas');
  });

  test('un documento completo no produce error de validacion', () => {
    assert.equal(new Empresa(COMPLETO).validateSync(), undefined);
  });

  test('nombre, cantidad y usuarioId son obligatorios uno por uno', () => {
    const { nombre, ...sinNombre } = COMPLETO;
    const { cantidad, ...sinCantidad } = COMPLETO;
    const { usuarioId, ...sinUsuarioId } = COMPLETO;

    assert.equal(new Empresa(sinNombre).validateSync().errors.nombre.kind, 'required');
    assert.equal(new Empresa(sinCantidad).validateSync().errors.cantidad.kind, 'required');
    assert.equal(new Empresa(sinUsuarioId).validateSync().errors.usuarioId.kind, 'required');
  });

  test('usuarioId es un ObjectId que referencia a "Usuario"', () => {
    const path = Empresa.schema.path('usuarioId');
    assert.equal(path.instance, 'ObjectId');
    assert.equal(path.options.ref, 'Usuario');
  });

  test('un string hexadecimal de 24 caracteres se castea a ObjectId', () => {
    const empresa = new Empresa(COMPLETO);
    assert.equal(empresa.usuarioId.constructor.name, 'ObjectId');
    assert.equal(String(empresa.usuarioId), USUARIO_ID);
  });

  test('los demas paths declarados son opcionales', () => {
    for (const path of ['ticker', 'precio', 'capitalInvertido', 'industria', 'valoracion']) {
      assert.notEqual(Empresa.schema.path(path).isRequired, true, path);
    }
  });

  test('el schema de Empresa no declara ningun indice', () => {
    assert.deepEqual(Empresa.schema.indexes(), []);
  });

  test('la conexion sigue desconectada durante toda la suite', () => {
    assert.equal(mongoose.connection.readyState, 0);
  });
});
