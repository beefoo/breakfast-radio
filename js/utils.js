function clamp(value, lower, upper) {
  if (value > upper) value = upper;
  if (value < lower) value = lower;
  return value;
}

function lerp(a, b, percent) {
  return (1.0 * b - a) * percent + a;
}

function norm(value, a, b) {
  return (1.0 * value - a) / (b - a);
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
