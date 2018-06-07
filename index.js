const crypto = require('crypto')
const maxRange = 4294967296  // 2^32
const maxIter  = 100

//rejection sampling; see: http://dimitri.xyz/random-ints-from-random-bits/
function getRandSample(){
  return crypto.randomBytes(4).readUInt32LE();
}

function unsafeCoerce(sample, range){
  return sample % range;
}
function inExtendedRange(sample, range){
  return sample < Math.floor(maxRange / range) * range;
}

function rejectionSampling(range, inRange, coerce){
  var sample;
  var i = 0;
  do {
    sample = getRandSample();
    if (i >= maxIter) {
      console.error('brobbot-roll: too many iterations. Check your source of randomness.');
      break;
    }
    i++;
  } while (!inRange(sample, range));
  return coerce(sample, range)
}

function getRandIntLessThan(range) {
  return rejectionSampling(Math.ceil(range), inExtendedRange, unsafeCoerce);
}

function getRandIntInclusive(low, hi) {
  if (low <= hi) {
    const l = Math.ceil(low);
    const h = Math.floor(hi);
    return (l + getRandIntLessThan( h - l + 1));
  }
  return NaN;
}


module.exports = (robot) => {
  robot.helpCommand("brobbot roll `dice`", "Roll `dice` and report the outcomes. E.g. `roll d20 2d6`");
  robot.helpCommand("brobbot skill-check `dc` `modifier`", "Roll a d20, add the modifier and report the outcome.");

  robot.respond(/^roll\s+((([0-9]*d[0-9]+)\s*)+)/i, (msg) => {
    const dice = msg.match[1];
    if (dice) {
      const results = dice.split(/\s+/).map(function(die) {
        let [num, size] = die.split('d');
        num = num ? Math.abs(parseInt(num, 10)) : 1;
        size = size ? Math.abs(parseInt(size, 10)) : 20;
        let result = 0;
        for (let i = 0; i < num; i++) {
          result += getRandIntInclusive(1, size);
        }
        return `${die}: ${result}`;
      });
      //TODO flavor text
      msg.send(`Rolled ${results.join(', ')}`);
    }
    else {
      msg.send('Wat.');
    }
  });

  robot.respond(/^skill-check(\s+([0-9]+)?\s+(-?[0-9]+)?)?/i, (msg) => {
    const dc = parseInt(msg.match[2], 10) || 10;
    const mod = parseInt(msg.match[3], 10) || 0;
    const roll = getRandIntInclusive(1, 20);
    const success = roll + mod >= dc;
    const op = mod < 0 ? '-' : '+';
    let text;
    //TODO flavor text
    if (roll === 1) {
      text = 'Critical failure!';
    }
    else if (roll === 20) {
      text = 'Critical success!';
    }
    else if (success) {
      text = 'You passed.';
    }
    else {
      text = 'You failed.';
    }
    msg.send(`${text} (${roll} ${op} ${Math.abs(mod)})`);
  });
};
