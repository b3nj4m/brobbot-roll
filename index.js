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
  robot.helpCommand("brobbot roll `dice`", "Roll `dice` and report the outcomes. E.g. `roll d20 + 4 2d6`");
  robot.helpCommand("brobbot skill-check `dc` `modifier`", "Roll a d20, add the modifier and report the outcome.");


  robot.respond(/^roll\s+(.+)/i, (msg) => {
    const dieRegex = /^([0-9]*d[0-9]+)\s*([+-]\s*[0-9]+)?\s*/i;
    let dice = msg.match[1];
    if (dice) {
      const results = [];
      while (dieRegex.test(dice)) {
        let [match, die, modifier] = dieRegex.exec(dice);
        let [num, size] = die.split('d');
        num = num ? Math.max(1, Math.min(Math.abs(parseInt(num, 10)), 100)) : 1;
        size = size ? Math.max(2, Math.abs(parseInt(size, 10))) : 20;
        modifier = modifier ? parseInt(modifier.replace(/\s+/g, ''), 10) : 0;

        if (size && num) {
          let result = modifier;
          for (let i = 0; i < num; i++) {
            result += getRandIntInclusive(1, size);
          }

          const op = modifier < 0 ? '-' : '+';
          const roll = `${num}d${size}` + (modifier ? ` ${op} ${Math.abs(modifier)}` : '');
          results.push(`${roll}: ${result}`);
        }

        dice = dice.replace(dieRegex, '');
      }
      //TODO flavor text
      if (results.length > 0) {
        return msg.send(`Rolled ${results.join(', ')}`);
      }
    }
    return msg.send('Wat.');
  });

  robot.respond(/^skill-check\s*([^\s]+)?\s*([^\s]+)?/i, (msg) => {
    let [match, dc, mod] = msg.match;
    dc = dc ? parseInt(dc, 10) : 10;
    mod = mod ? parseInt(mod, 10) : 0;
    if (dc && (mod || mod === 0)) {
      const roll = getRandIntInclusive(1, 20);
      const success = roll + mod >= dc;
      const op = mod < 0 ? '-' : '+';
      let text;
      //TODO flavor text
      if (roll === 1) {
        text = 'critical failure!';
      }
      else if (roll === 20) {
        text = 'critical success!';
      }
      else if (success) {
        text = 'you passed.';
      }
      else {
        text = 'you failed.';
      }
      return msg.send(`DC ${dc} skill check: ${text} (${roll} ${op} ${Math.abs(mod)})`);
    }
    return msg.send('Wat.');
  });
};
