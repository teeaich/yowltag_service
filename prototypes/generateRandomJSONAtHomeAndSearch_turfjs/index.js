/**
 * Created by ht3597 on 13.06.2017.
 */
require("util").inspect.defaultOptions.depth = null;
const turf = require('@turf/turf');
const fs = require('fs');

const points = turf.random('points', 100, {
  // bbox: [8.191606, 8.249088, 50.069518, 50.087193],
  bbox: [8.191606, 50.069518, 8.249088, 50.087193],
});

const center = turf.point([8.222045, 50.077510]);
const radius = 0.5;
const units = 'kilometers';

const circle = turf.circle(center, radius, 64, units);
console.log(circle);

fs.writeFile('./circle.json', JSON.stringify(circle, null, 2), 'utf-8');
const circleFlatten = turf.flatten(circle);
fs.writeFile('./circleFlatten.json', JSON.stringify(circleFlatten, null, 2), 'utf-8');

const ptsWithin = turf.within(points, circleFlatten);

console.log(points);
console.log(ptsWithin);
fs.writeFile('./data.json', JSON.stringify(points, null, 2), 'utf-8');
fs.writeFile('./dataWithin.json', JSON.stringify(ptsWithin, null, 2), 'utf-8');
