BEGIN;

CREATE TABLE public.time_blocks_lock_leases (
  user_id text PRIMARY KEY CHECK (pg_catalog.length(pg_catalog.btrim(user_id)) BETWEEN 1 AND 512),
  owner_token uuid NOT NULL,
  fencing_token bigint NOT NULL CHECK (fencing_token > 0),
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.clock_timestamp()
);

CREATE TABLE public.time_blocks_schedule_heads (
  user_id text PRIMARY KEY CHECK (pg_catalog.length(pg_catalog.btrim(user_id)) BETWEEN 1 AND 512),
  fencing_token bigint NOT NULL CHECK (fencing_token > 0),
  object_path text NOT NULL CHECK (pg_catalog.left(object_path, 13) = '_time-blocks/'),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.clock_timestamp()
);

ALTER TABLE public.time_blocks_lock_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_blocks_schedule_heads ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.time_blocks_lock_leases FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.time_blocks_schedule_heads FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.time_blocks_lock_leases TO service_role;
GRANT ALL ON TABLE public.time_blocks_schedule_heads TO service_role;

CREATE OR REPLACE FUNCTION public.time_blocks_acquire_lease(
  p_user_id text,
  p_owner_token uuid,
  p_ttl_ms integer
)
RETURNS TABLE (fencing_token bigint, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_fencing_token bigint;
  v_expires_at timestamptz;
BEGIN
  IF p_user_id IS NULL OR pg_catalog.length(pg_catalog.btrim(p_user_id)) = 0 THEN
    RAISE EXCEPTION 'user id is required' USING ERRCODE = '22023';
  END IF;
  IF p_owner_token IS NULL THEN
    RAISE EXCEPTION 'lease owner token is required' USING ERRCODE = '22023';
  END IF;
  IF p_ttl_ms IS NULL OR p_ttl_ms < 1000 OR p_ttl_ms > 300000 THEN
    RAISE EXCEPTION 'lease duration is outside the allowed range' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.time_blocks_lock_leases AS current_lease (
    user_id,
    owner_token,
    fencing_token,
    expires_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_owner_token,
    1,
    pg_catalog.clock_timestamp() + pg_catalog.make_interval(secs => p_ttl_ms::double precision / 1000.0),
    pg_catalog.clock_timestamp()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET owner_token = EXCLUDED.owner_token,
      fencing_token = current_lease.fencing_token + 1,
      expires_at = EXCLUDED.expires_at,
      updated_at = EXCLUDED.updated_at
  WHERE current_lease.expires_at <= pg_catalog.clock_timestamp()
  RETURNING current_lease.fencing_token, current_lease.expires_at
  INTO v_fencing_token, v_expires_at;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  fencing_token := v_fencing_token;
  expires_at := v_expires_at;
  RETURN NEXT;
END;
$function$;

CREATE OR REPLACE FUNCTION public.time_blocks_release_lease(
  p_user_id text,
  p_owner_token uuid,
  p_fencing_token bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.time_blocks_lock_leases
  SET expires_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  WHERE user_id = p_user_id
    AND owner_token = p_owner_token
    AND fencing_token = p_fencing_token
    AND expires_at > pg_catalog.clock_timestamp();

  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.time_blocks_publish_schedule(
  p_user_id text,
  p_owner_token uuid,
  p_fencing_token bigint,
  p_object_path text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_published boolean := false;
BEGIN
  IF p_object_path IS NULL OR pg_catalog.left(p_object_path, 13) <> '_time-blocks/' THEN
    RAISE EXCEPTION 'schedule path is outside the time-block namespace' USING ERRCODE = '22023';
  END IF;

  PERFORM 1
  FROM public.time_blocks_lock_leases AS lease
  WHERE lease.user_id = p_user_id
    AND lease.owner_token = p_owner_token
    AND lease.fencing_token = p_fencing_token
    AND lease.expires_at > pg_catalog.clock_timestamp()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO public.time_blocks_schedule_heads AS current_head (
    user_id,
    fencing_token,
    object_path,
    updated_at
  )
  VALUES (
    p_user_id,
    p_fencing_token,
    p_object_path,
    pg_catalog.clock_timestamp()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET fencing_token = EXCLUDED.fencing_token,
      object_path = EXCLUDED.object_path,
      updated_at = EXCLUDED.updated_at
  WHERE current_head.fencing_token < EXCLUDED.fencing_token
  RETURNING true INTO v_published;

  IF FOUND THEN
    RETURN v_published;
  END IF;

  SELECT head.fencing_token = p_fencing_token AND head.object_path = p_object_path
  INTO v_published
  FROM public.time_blocks_schedule_heads AS head
  WHERE head.user_id = p_user_id;

  RETURN COALESCE(v_published, false);
END;
$function$;

REVOKE ALL ON FUNCTION public.time_blocks_acquire_lease(text, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.time_blocks_release_lease(text, uuid, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.time_blocks_publish_schedule(text, uuid, bigint, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.time_blocks_acquire_lease(text, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.time_blocks_release_lease(text, uuid, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.time_blocks_publish_schedule(text, uuid, bigint, text) TO service_role;

COMMIT;
