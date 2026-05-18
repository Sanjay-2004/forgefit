-- One-time cleanup: ensure only one active program per user.
-- Keep the most recently updated active row and deactivate the rest.

WITH ranked AS (
  SELECT
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC, id DESC
    ) AS rn
  FROM public.workout_programs
  WHERE is_active = true
)
UPDATE public.workout_programs wp
SET is_active = false
FROM ranked r
WHERE wp.id = r.id
  AND r.rn > 1;

-- Future guard: at most one active program per user.
CREATE UNIQUE INDEX IF NOT EXISTS ux_workout_programs_one_active_per_user
ON public.workout_programs (user_id)
WHERE is_active = true;
