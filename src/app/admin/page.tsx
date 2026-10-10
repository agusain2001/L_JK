import AdminDashboard from "@/components/AdminDashboard";
import { adminEnabled, isAdmin } from "@/lib/security";
export const dynamic = "force-dynamic";
export default async function Admin() {
  return (
    <AdminDashboard
      initialAuthed={await isAdmin()}
      enabled={adminEnabled()}
      configured={{
        dataset: !!(
          process.env.APIFY_API_TOKEN && process.env.APIFY_DATASET_ID
        ),
        task: !!(process.env.APIFY_API_TOKEN && process.env.APIFY_TASK_ID),
        actor: !!(
          process.env.APIFY_API_TOKEN &&
          process.env.APIFY_ACTOR_ID &&
          process.env.APIFY_ACTOR_INPUT_FILE &&
          process.env.APIFY_ACTOR_SCHEMA_VERIFIED === "true"
        ),
      }}
    />
  );
}
