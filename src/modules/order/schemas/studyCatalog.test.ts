import assert from 'node:assert/strict'
import test from 'node:test'

import { cbctDetailsSchema, endodonticEvaluationDetailsSchema, publicStudyTypes, radiography2dDefaults, radiography2dDetailsSchema } from './studyCatalog'

test('public study catalog preserves order and excludes endodontic evaluations', () => {
  assert.deepEqual(publicStudyTypes, ['radiography', 'radiography_2d', 'cbct', 'cephalometric_analysis', 'study_models', 'intraoral_scan', 'orthodontic_package', 'aligner_package', 'laboratory_order'])
})

test('radiography 2D variant defaults include its required conditional fields', () => {
  assert.deepEqual(radiography2dDefaults('half_panoramic'), { variant: 'half_panoramic', side: 'left' })
  assert.deepEqual(radiography2dDefaults('waters'), { variant: 'waters', mouthPosition: 'open' })
  assert.equal(radiography2dDetailsSchema.safeParse(radiography2dDefaults('half_panoramic')).success, true)
  assert.equal(radiography2dDetailsSchema.safeParse({ variant: 'half_panoramic' }).success, false)
})

test('endodontic evaluations retain fistula location and complete repeatable canal details', () => {
  assert.equal(endodonticEvaluationDetailsSchema.safeParse({ toothNumber: '11', fistulaLocation: 'Vestibular', canals: [{ canal: 'Vestibular', characteristics: 'Curvo', tentativeLength: 21, workingLength: 20, guttaPerchaPoint: '25/.06' }] }).success, true)
})

test('CBCT enforces contextual FOV regions and permits one or more 15x9 regions', () => {
  assert.equal(cbctDetailsSchema.safeParse({ fov: '15x9', region: ['tmj'], tmjPosition: 'occlusion' }).success, true)
  assert.equal(cbctDetailsSchema.safeParse({ fov: '15x9', region: ['tmj', 'airways'], tmjPosition: 'both' }).success, true)
  assert.equal(cbctDetailsSchema.safeParse({ fov: '15x9', region: [] }).success, false)
  assert.equal(cbctDetailsSchema.safeParse({ fov: '15x9', region: ['teeth'] }).success, false)
  assert.equal(cbctDetailsSchema.safeParse({ fov: '8x5', region: 'teeth' }).success, false)
  assert.equal(cbctDetailsSchema.safeParse({ fov: '4x4', region: 'teeth', toothNumbers: ['11'], amperage: 'normal' }).success, true)
  assert.equal(cbctDetailsSchema.safeParse({ fov: '4x4', region: 'teeth', toothNumbers: ['11', '12', '13', '14'], amperage: 'normal' }).success, false)
})
