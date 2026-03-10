import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL);

async function main() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS admin_notification (
      id text PRIMARY KEY,
      user_name text NOT NULL,
      user_email text NOT NULL,
      event_type text NOT NULL DEFAULT 'user_signup',
      read boolean NOT NULL DEFAULT false,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `);

  await sql.unsafe(`ALTER TABLE admin_notification ENABLE ROW LEVEL SECURITY;`);

  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION notify_admin_on_user_signup()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO admin_notification (id, user_name, user_email, event_type, read)
      VALUES (gen_random_uuid()::text, COALESCE(NEW.name, '新用户'), COALESCE(NEW.email, 'unknown@example.com'), 'user_signup', false);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await sql.unsafe(`
    DROP TRIGGER IF EXISTS trg_notify_admin_user_signup ON "user";
    CREATE TRIGGER trg_notify_admin_user_signup
    AFTER INSERT ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_on_user_signup();
  `);

  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION notify_admin_on_guestbook_message()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO admin_notification (id, user_name, user_email, event_type, read)
      VALUES (
        gen_random_uuid()::text,
        COALESCE(NEW.name, '访客'),
        COALESCE(NEW.contact, 'guestbook@anonymous.local'),
        'guestbook_message',
        false
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await sql.unsafe(`
    DROP TRIGGER IF EXISTS trg_notify_admin_guestbook_message ON guestbook_message;
    CREATE TRIGGER trg_notify_admin_guestbook_message
    AFTER INSERT ON guestbook_message
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_on_guestbook_message();
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS blog_comment (
      id text PRIMARY KEY NOT NULL,
      blog_id text NOT NULL REFERENCES blog(id) ON DELETE CASCADE,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      parent_id text REFERENCES blog_comment(id) ON DELETE CASCADE,
      content text NOT NULL,
      status text NOT NULL DEFAULT 'approved',
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now()
    );
  `);

  await sql.unsafe(`
    ALTER TABLE blog_comment ENABLE ROW LEVEL SECURITY;
  `);

  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION notify_admin_on_blog_comment()
    RETURNS trigger AS $$
    DECLARE
      v_user_name text;
      v_user_email text;
    BEGIN
      SELECT name, email INTO v_user_name, v_user_email
      FROM "user"
      WHERE id = NEW.user_id;

      INSERT INTO admin_notification (id, user_name, user_email, event_type, read)
      VALUES (
        gen_random_uuid()::text,
        COALESCE(v_user_name, '匿名用户'),
        COALESCE(v_user_email, 'comment@anonymous.local'),
        'blog_comment',
        false
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await sql.unsafe(`
    DROP TRIGGER IF EXISTS trg_notify_admin_blog_comment ON blog_comment;
    CREATE TRIGGER trg_notify_admin_blog_comment
    AFTER INSERT ON blog_comment
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_on_blog_comment();
  `);

  await sql.unsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'admin_notification'
      ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notification';
      END IF;
    END $$;
  `);

  console.log("admin_notification triggers applied");
}

main()
  .catch((error) => {
    console.error("Failed to apply admin notification triggers:", error);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
