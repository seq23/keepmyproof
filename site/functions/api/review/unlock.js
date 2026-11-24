// POST /api/review/unlock { code, app_user_id }: the Play reviewer's 7-day Plus grant. See site/server/review.mjs.
import { reviewUnlock } from '../../../server/review.mjs';
export const onRequestPost = ({ request, env, waitUntil }) => reviewUnlock(request, env, { waitUntil });
