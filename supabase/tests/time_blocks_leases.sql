BEGIN;

DO $test$
DECLARE
  test_user text := 'time-block-lease-test-' || pg_catalog.gen_random_uuid()::text;
  owner_a uuid := pg_catalog.gen_random_uuid();
  owner_b uuid := pg_catalog.gen_random_uuid();
  owner_c uuid := pg_catalog.gen_random_uuid();
  lease_a record;
  lease_b record;
  lease_c record;
  role_name text;
  table_name text;
BEGIN
  SELECT * INTO lease_a
  FROM public.time_blocks_acquire_lease(test_user, owner_a, 120000);
  IF lease_a.fencing_token IS NULL THEN
    RAISE EXCEPTION 'first lease was not acquired';
  END IF;

  SELECT * INTO lease_b
  FROM public.time_blocks_acquire_lease(test_user, owner_b, 120000);
  IF lease_b.fencing_token IS NOT NULL THEN
    RAISE EXCEPTION 'a second active writer acquired the lease';
  END IF;

  IF NOT public.time_blocks_publish_schedule(
    test_user,
    owner_a,
    lease_a.fencing_token,
    '_time-blocks/schedules/test/1-owner-a.json'
  ) THEN
    RAISE EXCEPTION 'the active lease could not publish its schedule';
  END IF;

  IF NOT public.time_blocks_release_lease(test_user, owner_a, lease_a.fencing_token) THEN
    RAISE EXCEPTION 'the lease owner could not release its lease';
  END IF;

  SELECT * INTO lease_b
  FROM public.time_blocks_acquire_lease(test_user, owner_b, 120000);
  IF lease_b.fencing_token IS NULL OR lease_b.fencing_token <= lease_a.fencing_token THEN
    RAISE EXCEPTION 'reacquisition did not advance the fencing token';
  END IF;

  UPDATE public.time_blocks_lock_leases
  SET expires_at = pg_catalog.clock_timestamp() - INTERVAL '1 second'
  WHERE user_id = test_user;

  SELECT * INTO lease_c
  FROM public.time_blocks_acquire_lease(test_user, owner_c, 120000);
  IF lease_c.fencing_token IS NULL OR lease_c.fencing_token <= lease_b.fencing_token THEN
    RAISE EXCEPTION 'expired lease recovery did not advance the fencing token';
  END IF;

  IF public.time_blocks_publish_schedule(
    test_user,
    owner_b,
    lease_b.fencing_token,
    '_time-blocks/schedules/test/stale-owner-b.json'
  ) THEN
    RAISE EXCEPTION 'an expired lease published over its successor';
  END IF;

  IF public.time_blocks_release_lease(test_user, owner_b, lease_b.fencing_token) THEN
    RAISE EXCEPTION 'an expired lease released its successor';
  END IF;

  IF NOT public.time_blocks_publish_schedule(
    test_user,
    owner_c,
    lease_c.fencing_token,
    '_time-blocks/schedules/test/3-owner-c.json'
  ) THEN
    RAISE EXCEPTION 'the successor lease could not publish its schedule';
  END IF;

  IF NOT public.time_blocks_release_lease(test_user, owner_c, lease_c.fencing_token) THEN
    RAISE EXCEPTION 'the successor lease could not release its lease';
  END IF;

  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    FOREACH table_name IN ARRAY ARRAY[
      'public.time_blocks_lock_leases',
      'public.time_blocks_schedule_heads'
    ] LOOP
      IF pg_catalog.has_table_privilege(role_name, table_name, 'SELECT')
        OR pg_catalog.has_table_privilege(role_name, table_name, 'INSERT')
        OR pg_catalog.has_table_privilege(role_name, table_name, 'UPDATE')
        OR pg_catalog.has_table_privilege(role_name, table_name, 'DELETE') THEN
        RAISE EXCEPTION 'browser role % can access private table %', role_name, table_name;
      END IF;
    END LOOP;

    IF pg_catalog.has_function_privilege(
      role_name,
      'public.time_blocks_acquire_lease(text,uuid,integer)'::regprocedure,
      'EXECUTE'
    ) OR pg_catalog.has_function_privilege(
      role_name,
      'public.time_blocks_release_lease(text,uuid,bigint)'::regprocedure,
      'EXECUTE'
    ) OR pg_catalog.has_function_privilege(
      role_name,
      'public.time_blocks_publish_schedule(text,uuid,bigint,text)'::regprocedure,
      'EXECUTE'
    ) THEN
      RAISE EXCEPTION 'browser role % can execute a private lease function', role_name;
    END IF;
  END LOOP;

  IF NOT pg_catalog.has_function_privilege(
    'service_role',
    'public.time_blocks_acquire_lease(text,uuid,integer)'::regprocedure,
    'EXECUTE'
  ) OR NOT pg_catalog.has_function_privilege(
    'service_role',
    'public.time_blocks_release_lease(text,uuid,bigint)'::regprocedure,
    'EXECUTE'
  ) OR NOT pg_catalog.has_function_privilege(
    'service_role',
    'public.time_blocks_publish_schedule(text,uuid,bigint,text)'::regprocedure,
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'server role cannot execute the private lease functions';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS relation
    JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relname IN ('time_blocks_lock_leases', 'time_blocks_schedule_heads')
      AND NOT relation.relrowsecurity
  ) OR (
    SELECT pg_catalog.count(*)
    FROM pg_catalog.pg_class AS relation
    JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relname IN ('time_blocks_lock_leases', 'time_blocks_schedule_heads')
      AND relation.relrowsecurity
  ) <> 2 THEN
    RAISE EXCEPTION 'row-level security is not enabled for both private tables';
  END IF;
END;
$test$;

ROLLBACK;
