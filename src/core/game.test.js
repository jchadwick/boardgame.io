/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { Game } from './game';
import { Client } from '../client/client';

describe('basic', () => {
  let game;
  beforeAll(() => {
    game = Game({
      moves: {
        A: G => G,
        B: () => null,
        C: {
          move: () => 'C',
        },
      },

      phases: {
        PA: {
          moves: {
            A: () => 'PA.A',
          },
        },
      },
    });
  });

  test('sanity', () => {
    expect(game.moveNames).toEqual(['A', 'B', 'C']);
    expect(typeof game.processMove).toEqual('function');
  });

  test('processMove', () => {
    const testObj = { test: true };
    const ctx = { phase: '' };
    expect(game.processMove(testObj, { type: 'A' }, ctx)).toEqual(testObj);
    expect(game.processMove(testObj, { type: 'D' }, ctx)).toEqual(testObj);
    expect(game.processMove(testObj, { type: 'B' }, ctx)).toEqual(null);
    expect(game.processMove(testObj, { type: 'A' }, { phase: 'PA' })).toEqual(
      'PA.A'
    );
  });

  test('long-form move syntax', () => {
    expect(game.processMove({}, { type: 'C' }, { phase: '' })).toEqual('C');
  });
});

// Following turn order is often used in worker placement games like Agricola and Viticulture.
test('rounds with starting player token', () => {
  const game = {
    setup: () => ({ startingPlayerToken: 0 }),

    moves: {
      takeStartingPlayerToken: (G, ctx) => {
        G.startingPlayerToken = ctx.currentPlayer;
      },
    },

    phases: {
      main: {
        start: true,
        turn: {
          order: {
            first: G => G.startingPlayerToken,
            next: (G, ctx) => (+ctx.playOrderPos + 1) % ctx.playOrder.length,
          },
        },
      },
    },
  };

  const client = Client({ game, numPlayers: 4 });

  expect(client.getState().ctx.currentPlayer).toBe('0');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('1');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('2');

  client.moves.takeStartingPlayerToken();
  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('3');

  client.events.endTurn();
  client.events.setPhase('main');
  expect(client.getState().ctx.currentPlayer).toBe('2');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('3');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('0');
});

// The following pattern is used in Catan, Twilight Imperium, and (sort of) Powergrid.
test('serpentine setup phases', () => {
  const game = {
    phases: {
      'first setup round': {
        start: true,
        turn: {
          order: {
            first: () => 0,
            next: (G, ctx) => (+ctx.playOrderPos + 1) % ctx.playOrder.length,
          },
        },
        next: 'second setup round',
      },
      'second setup round': {
        turn: {
          order: {
            first: (G, ctx) => ctx.playOrder.length - 1,
            next: (G, ctx) => (+ctx.playOrderPos - 1) % ctx.playOrder.length,
          },
        },
        next: 'main phase',
      },
      'main phase': {
        turn: {
          order: {
            first: () => 0,
            next: (G, ctx) => (+ctx.playOrderPos + 1) % ctx.playOrder.length,
          },
        },
      },
    },
  };

  const numPlayers = 4;
  const client = Client({ game, numPlayers });

  expect(client.getState().ctx.currentPlayer).toBe('0');
  expect(client.getState().ctx.phase).toBe('first setup round');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('1');
  expect(client.getState().ctx.phase).toBe('first setup round');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('2');
  expect(client.getState().ctx.phase).toBe('first setup round');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('3');
  expect(client.getState().ctx.phase).toBe('first setup round');

  client.events.endTurn();
  client.events.endPhase();
  expect(client.getState().ctx.currentPlayer).toBe('3');
  expect(client.getState().ctx.phase).toBe('second setup round');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('2');
  expect(client.getState().ctx.phase).toBe('second setup round');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('1');
  expect(client.getState().ctx.phase).toBe('second setup round');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('0');
  expect(client.getState().ctx.phase).toBe('second setup round');

  client.events.endTurn();
  client.events.endPhase();
  expect(client.getState().ctx.currentPlayer).toBe('0');
  expect(client.getState().ctx.phase).toBe('main phase');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('1');
  expect(client.getState().ctx.phase).toBe('main phase');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('2');
  expect(client.getState().ctx.phase).toBe('main phase');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('3');
  expect(client.getState().ctx.phase).toBe('main phase');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('0');
  expect(client.getState().ctx.phase).toBe('main phase');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('1');
  expect(client.getState().ctx.phase).toBe('main phase');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('2');
  expect(client.getState().ctx.phase).toBe('main phase');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('3');
  expect(client.getState().ctx.phase).toBe('main phase');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('0');
  expect(client.getState().ctx.phase).toBe('main phase');

  client.events.endTurn();
  expect(client.getState().ctx.currentPlayer).toBe('1');
  expect(client.getState().ctx.phase).toBe('main phase');
});
