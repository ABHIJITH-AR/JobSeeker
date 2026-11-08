const express = require('express');
const { INDIA_LOCATIONS, STATES, STATE_NAMES, UT_NAMES } = require('../data/indiaLocations');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, locations: INDIA_LOCATIONS, states: STATES, stateNames: STATE_NAMES, unionTerritories: UT_NAMES });
});

router.get('/states', (req, res) => {
  res.json({ success: true, states: STATES, stateNames: STATE_NAMES, unionTerritories: UT_NAMES });
});

router.get('/districts', (req, res) => {
  const { state } = req.query;
  const found = INDIA_LOCATIONS.find((item) => item.name === state);
  if (!found) return res.status(404).json({ success: false, message: 'State or union territory not found.' });
  return res.json({ success: true, districts: found.districts.map((d) => d.name) });
});

router.get('/cities', (req, res) => {
  const { state, district } = req.query;
  const found = INDIA_LOCATIONS.find((item) => item.name === state);
  if (!found) return res.status(404).json({ success: false, message: 'State or union territory not found.' });
  if (!district) {
    return res.json({ success: true, cities: found.districts.flatMap((d) => d.cities) });
  }
  const districtFound = found.districts.find((d) => d.name === district);
  if (!districtFound) return res.status(404).json({ success: false, message: 'District not found in the selected state.' });
  return res.json({ success: true, cities: districtFound.cities });
});

module.exports = router;
