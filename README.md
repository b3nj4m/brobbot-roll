# brobbot-roll

A brobbot plugin for rolling dice.

```
brobbot roll <dice>
```

Roll dice and report the results. Dice should be a space-separated list of the format `ndm [+/- p]` where `n` is a number of dice, `m` is a size of dice and `p` is an optional integer modifier.

```
brobbot skill-check <dc> <modifier>
```

Roll a d20, add the modifier, and report whether the sum is greater than or equal to the dc. 20 is a critical success, 1 is a critical failure.

## Configuration (environment variables)

(none)

