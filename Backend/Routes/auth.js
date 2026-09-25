import express from 'express'
import { participantSignup, organizerSignup, login } from '../Controllers/auth.js';
const router = express.Router();

router.post('/participantSignup', participantSignup)
router.post('/organizerSignup', organizerSignup)
router.post('/login', login)

export default router;