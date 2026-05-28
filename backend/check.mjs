import('./reviews/routes/reviewRoutes.js').then(m => console.log('OK', Object.keys(m))).catch(e => console.log('FAIL', e.message))
