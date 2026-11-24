// GET /api/review: 200 {open:true} while a Play review window is open, else 404. See site/server/review.mjs.
import { reviewStatus } from '../../../server/review.mjs';
export const onRequestGet = ({ env }) => reviewStatus(env);
