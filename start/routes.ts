/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import FamiliesController from '#controllers/families_controller'

import router from '@adonisjs/core/services/router'
router.on('/').renderInertia('home')
router.get('/families', [FamiliesController, 'index'])
router.post('/families/save', [FamiliesController, 'save'])
router.post('/families/delete', [FamiliesController, 'delete'])
