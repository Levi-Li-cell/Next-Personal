import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL);

async function main() {
  await sql.unsafe(`DROP TRIGGER IF EXISTS trg_notify_admin_user_signup ON "user";`);
  await sql.unsafe(`DROP TRIGGER IF EXISTS trg_notify_admin_guestbook_message ON guestbook_message;`);
  await sql.unsafe(`DROP TRIGGER IF EXISTS trg_notify_admin_blog_comment ON blog_comment;`);

  await sql.unsafe(`DROP FUNCTION IF EXISTS notify_admin_on_user_signup();`);
  await sql.unsafe(`DROP FUNCTION IF EXISTS notify_admin_on_guestbook_message();`);
  await sql.unsafe(`DROP FUNCTION IF EXISTS notify_admin_on_blog_comment();`);

  console.log("admin notification triggers disabled");
}

main()
  .catch((error) => {
    console.error("Failed to disable admin notification triggers:", error);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
