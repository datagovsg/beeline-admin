
export function satisfiesEvent(e, eventConditions) {
  // Ensure that array keys are superset of the same
  // key in e

  const arrayKeysMatch = e.event == eventConditions.event &&
    _.keys(eventConditions.defaultParams)
    .filter(k => eventConditions.defaultParams[k] instanceof Array)
    .every(k => _.difference(eventConditions.defaultParams[k], e.params[k]).length == 0);

  const valueKeysMatch = e.event == eventConditions.event &&
    _.keys(eventConditions.defaultParams)
    .filter(k => !(eventConditions.defaultParams[k] instanceof Array))
    .every(k => eventConditions.defaultParams[k] === e.params[k]);

  return valueKeysMatch && arrayKeysMatch;
}

/**
 * Stringifies an object s.t. if the keys and values
 * are the same, the same output is also guaranteed.
 * This way objects can be used for hashing
 */
export function stringify(object) {
  if (typeof(object) !== 'object' || object === null) {
    return object;
  } else {
    return _(object)
      .toPairs()
      .sortBy(x => x[0])
      .map(([x,y]) => `${x}:${stringify(y)}`)
      .join('\n')
  }
}

export const EVENT_TYPES = {
  newBooking: {
    event: 'newBooking',
  },
  noPings5: {
    event: 'noPings',
    defaultParams: {
      minsBefore: [5],
    }
  },
  noPings15: {
    event: 'noPings',
    defaultParams: {
      minsBefore: [15],
    }
  },
  noPings25: {
    event: 'noPings',
    defaultParams: {
      minsBefore: [25],
    }
  },
  lateETA: {
    event: 'lateETA',
    defaultParams: {
      timeAfter: 10*60000,
    }
  },
  passengersMessaged: {
    event: 'passengersMessaged',
  },
  tripCancelled: {
    event: 'tripCancelled',
  },
}